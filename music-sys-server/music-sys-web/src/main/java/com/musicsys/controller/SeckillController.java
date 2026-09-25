package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.service.SeckillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seckill")
@RequiredArgsConstructor
public class SeckillController {

    private final SeckillService seckillService;

    /** 秒杀下单：userId 从请求参数传入（演示用，真实场景从登录态解析） */
    @PostMapping("/{id}/do")
    public R<?> doSeckill(@PathVariable Long id, @RequestParam Long userId) {
        String result = seckillService.seckill(id, userId);
        if ("秒杀成功".equals(result)) {
            return R.ok(result);
        }
        return R.fail(429, result);
    }

    /** 查询活动详情与剩余库存 */
    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(seckillService.getActivity(id));
    }
}
