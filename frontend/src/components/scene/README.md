# Scene Module Notes

当前 scene 层已经按以下结构组织：

- `RoomScene.tsx`：场景装配层
- `zone-renderers.tsx`：zone 分发层
- `ZoneCard.tsx`：通用壳层
- `zones/*`：按区域组织的 zone 组件与资产组件
- `scene-base.css` / `zone-card.css` / `assets/*.css`：场景与资产样式

## 约定

- 新增或修改具体区域时，优先在 `zones/<zone-key>/` 下扩展
- 不再把新的 zone 资产逻辑塞回 `RoomScene.tsx`
- 不再恢复 `ZoneAssetLayer` 这种中间转发层，zone-specific asset 由各自 zone 组件直接持有
