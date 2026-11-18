<?php
namespace app\controller;

use think\facade\Db;

/** 客户维护：客户和销售统计均沿用现有组织、数据权限。 */
class CustomerCare extends Acl
{
    private function customers() {
        return Db::name('customer')->where(sqlAuth('customer', frameScope([])));
    }
    private function sales() {
        return Db::name('sor')->where(sqlAuth('sor', frameScope([])));
    }
    private function range($input) {
        $mode = isset($input['period']) ? $input['period'] : 'quarter';
        $today = date('Y-m-d');
        if ($mode === 'custom') {
            $start = isset($input['start']) ? $input['start'] : '';
            $end = isset($input['end']) ? $input['end'] : '';
            foreach ([$start, $end] as $day) {
                $parsed = \DateTime::createFromFormat('!Y-m-d', $day);
                if (!$parsed || $parsed->format('Y-m-d') !== $day) throw new \InvalidArgumentException('请选择完整的起止日期');
            }
            $a = strtotime($start); $b = strtotime($end . ' +1 day');
            if ($a >= $b) throw new \InvalidArgumentException('结束日期不能早于开始日期');
            $previous = $a - ($b - $a);
        } else {
            if ($mode === 'year') { $start = date('Y-01-01'); $step = '+1 year'; $back = '-1 year'; }
            elseif ($mode === 'month') { $start = date('Y-m-01'); $step = '+1 month'; $back = '-1 month'; }
            else { $start = sprintf('%s-%02d-01', date('Y'), (int)(floor((date('n')-1)/3)*3+1)); $step = '+3 months'; $back = '-3 months'; }
            $a = strtotime($start); $b = strtotime($step, $a); $previous = strtotime($back, $a);
        }
        return [$a, $b, $previous];
    }
    public function record() {
        $input = input('post.');
        try { list($a, $b, $previous) = $this->range($input); }
        catch (\InvalidArgumentException $e) { return json(['state'=>'error','info'=>$e->getMessage()]); }
        $sixMonths = strtotime('-6 months', strtotime('today'));
        $stats = $this->sales()->fieldRaw("customer AS sales_customer, COUNT(*) AS order_count, MAX(time) AS last_order, SUM(actual) AS amount, SUM(CASE WHEN examine=0 THEN 1 ELSE 0 END) AS pending_count, SUM(CASE WHEN examine=0 THEN actual ELSE 0 END) AS pending_amount, MIN(CASE WHEN examine=0 THEN time ELSE NULL END) AS oldest_pending, SUM(CASE WHEN time >= $a AND time < $b THEN 1 ELSE 0 END) AS period_count, SUM(CASE WHEN time >= $a AND time < $b THEN actual ELSE 0 END) AS period_amount, SUM(CASE WHEN time >= $previous AND time < $a THEN 1 ELSE 0 END) AS previous_count")->group('customer')->buildSql();
        // 子查询先完成鉴权，避免联表字段与现有权限字段重名。
        $customers = $this->customers()->buildSql();
        $latest = Db::name('customer_followup')->fieldRaw('MAX(id)')->group('customer')->buildSql();
        $followups = Db::name('customer_followup')->whereRaw('id IN ' . $latest)->field('customer AS followup_customer, contact_time, next_time, content AS last_content')->buildSql();
        $q = Db::table($customers . ' c')->whereRaw('1=1')->leftJoin([$stats=>'s'], 's.sales_customer=c.id')->leftJoin([$followups=>'f'], 'f.followup_customer=c.id');
        foreach (['category','grade','user'] as $key) {
            if (isset($input[$key]) && $input[$key] !== '' && $input[$key] !== null) $q->where('c.'.$key, $input[$key]);
        }
        if (!empty($input['keyword'])) $q->where('c.name|c.number', 'like', '%'.trim($input['keyword']).'%');
        if (!empty($input['data'])) $q->where('c.data', 'like', '%'.trim($input['data']).'%');
        $trade = isset($input['trade']) ? $input['trade'] : 'pending';
        if ($trade === 'pending') $q->where('s.pending_count','>',0);
        if ($trade === 'dormant') $q->where('s.last_order','<',$sixMonths);
        if ($trade === 'noOrders') $q->whereRaw('COALESCE(s.period_count,0)=0');
        if ($trade === 'ordered') $q->where('s.period_count','>',0);
        if ($trade === 'never') $q->whereNull('s.sales_customer');
        if ($trade === 'lapsed') $q->where('s.order_count','>',0)->whereRaw('COALESCE(s.period_count,0)=0');
        if ($trade === 'previous') $q->where('s.previous_count','>',0)->whereRaw('COALESCE(s.period_count,0)=0');
        if (in_array((int)($input['days'] ?? 0), [30,60,90,180], true)) $q->where('s.last_order','<',strtotime('-'.(int)$input['days'].' days'));
        $today = strtotime('today'); $tomorrow = strtotime('tomorrow');
        $due = $input['due'] ?? '';
        if ($due === 'today') $q->where('f.next_time','>=',$today)->where('f.next_time','<',$tomorrow);
        if ($due === 'overdue') $q->where('f.next_time','>',0)->where('f.next_time','<',$today);
        if ($due === 'never') $q->whereNull('f.followup_customer');
        $summary = (clone $q)->fieldRaw("COUNT(*) AS total, COALESCE(SUM(CASE WHEN s.pending_count > 0 THEN 1 ELSE 0 END),0) AS pending, COALESCE(SUM(CASE WHEN s.last_order < $sixMonths THEN 1 ELSE 0 END),0) AS dormant, COALESCE(SUM(CASE WHEN COALESCE(s.period_count,0)=0 THEN 1 ELSE 0 END),0) AS no_orders, COALESCE(SUM(CASE WHEN s.sales_customer IS NULL THEN 1 ELSE 0 END),0) AS never, COALESCE(SUM(CASE WHEN f.next_time >= $today AND f.next_time < $tomorrow THEN 1 ELSE 0 END),0) AS today, COALESCE(SUM(CASE WHEN f.next_time > 0 AND f.next_time < $today THEN 1 ELSE 0 END),0) AS overdue")->find();
        $page = max(1,(int)($input['page'] ?? 1)); $limit = min(100,max(10,(int)($input['limit'] ?? 20)));
        $sort = $input['sort'] ?? '';
        if ($sort === 'last') $q->order('s.last_order','desc');
        elseif ($sort === 'amount') $q->order('s.period_amount','desc');
        else $q->orderRaw('CASE WHEN f.next_time > 0 THEN 0 ELSE 1 END, f.next_time ASC');
        $rows = $q->field('c.id,c.name,c.number,c.category,c.grade,c.user,c.data,s.order_count,s.last_order,s.amount,s.pending_count,s.pending_amount,s.oldest_pending,s.period_count,s.period_amount,s.previous_count,f.contact_time,f.next_time,f.last_content')->order('c.id','desc')->page($page,$limit)->select()->toArray();
        $users = Db::name('user')->whereIn('id', array_unique(array_column($rows,'user')))->column('name','id');
        foreach ($rows as &$row) { $row['user_name'] = $users[$row['user']] ?? ''; $row['days_since'] = $row['last_order'] ? max(0,(int)floor((time()-$row['last_order'])/86400)) : null; }
        unset($row);
        return json(['state'=>'success','info'=>$rows,'count'=>(int)$summary['total'],'summary'=>$summary,'range'=>[date('Y-m-d',$a),date('Y-m-d',$b-1)],'previousRange'=>[date('Y-m-d',$previous),date('Y-m-d',$a-1)]]);
    }
    public function detail() {
        $input = input('post.'); $id = (int)($input['id'] ?? 0);
        $customer = $this->customers()->where('id',$id)->find();
        if (!$customer) return json(['state'=>'error','info'=>'客户不存在或没有访问权限']);
        $sales = $this->sales()->where('customer',$id);
        $saleCount = (clone $sales)->count();
        $salesRows = $sales->field('id,number,time,actual,examine,state')->order('examine','asc')->order('time','desc')->order('id','desc')->page(max(1,(int)($input['salesPage'] ?? 1)),10)->select()->toArray();
        $followups = Db::name('customer_followup')->where('customer',$id);
        $followupCount = (clone $followups)->count();
        $followupRows = $followups->order('contact_time','desc')->order('id','desc')->page(max(1,(int)($input['followupPage'] ?? 1)),10)->select()->toArray();
        $users = Db::name('user')->whereIn('id',array_unique(array_column($followupRows,'user')))->column('name','id');
        foreach ($followupRows as &$row) $row['user_name'] = $users[$row['user']] ?? '';
        return json(['state'=>'success','customer'=>$customer,'sales'=>$salesRows,'saleCount'=>$saleCount,'followups'=>$followupRows,'followupCount'=>$followupCount]);
    }
    public function order() {
        $id = (int)input('post.parm',0);
        $order = $this->sales()->where('id',$id)->find();
        if (!$order || !$this->customers()->where('id',$order['customer'])->find()) return json(['state'=>'error','info'=>'订单不存在或没有访问权限']);
        return (new Sor(app()))->get();
    }
    public function saveFollowup() {
        $root = getUserRoot();
        if ($root !== 'all' && empty($root['base']['edit'])) return json(['state'=>'error','info'=>'没有客户修改权限'],403);
        $input = input('post.'); $id = (int)($input['customer'] ?? 0);
        if (!$this->customers()->where('id',$id)->find()) return json(['state'=>'error','info'=>'客户不存在或没有访问权限']);
        $content = trim($input['content'] ?? ''); $channel = $input['channel'] ?? '';
        $contact = strtotime($input['contact_time'] ?? ''); $next = empty($input['next_time']) ? 0 : strtotime($input['next_time']);
        if ($content === '' || mb_strlen($content)>2000 || !in_array($channel,['WhatsApp','电话','邮件','其他'],true)) return json(['state'=>'error','info'=>'请选择联系方式并填写回访内容（最多2000字）']);
        if (!$contact || $contact>time()+60 || $next === false || ($next && $next<strtotime(date('Y-m-d',$contact)))) return json(['state'=>'error','info'=>'请检查联系日期和下次回访日期，联系时间不能晚于当前时间']);
        Db::name('customer_followup')->insert(['customer'=>$id,'user'=>getUserID(),'contact_time'=>$contact,'channel'=>$channel,'content'=>$content,'next_time'=>$next,'create_time'=>time()]);
        return json(['state'=>'success','info'=>'回访已保存']);
    }
}
