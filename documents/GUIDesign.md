# GUI の設計

## エンティティ抽出

- User
- Task
- Plan
- Log
- Tag
- TimeEntry

### Figures

```mermaid
---
title: Entities
---
erDiagram
  %% USER ||--o{ PLAN : has
  %% USER ||--o{ TASK : has
  %% USER ||--o{ LOG : has
  %% USER ||--o{ TAG : has
  %% USER ||--o{ TIME_ENTRY : has
  %% USER ||--o{ TAG : has
  TASK ||--o{ TASK : has
  PLAN ||--o{ TASK : has
  TASK ||--o{ LOG :has
  LOG }o--o{ TAG : has
```

```mermaid
---
title: Views
---
classDiagram

```

## ビューのイメージ

タスクビューでは、ツリービューと詳細ビューがある？
ツリービューは分解するためのビュー。詳細ビューはログを取るためのビュー。
実行コンテクストも詳細ビュー。
