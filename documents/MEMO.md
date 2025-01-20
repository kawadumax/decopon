## プロジェクト初期化

```
git clone git@github.com:kawadumax/decopon.git
cp .env.example .env # git から落としてきた後、.env をコピーする。
composer install # phpの依存ファイルを入れる
npm install # jsの依存ファイルを入れる
```

DB の初期化

```
php artisan migrate
```

暗号化キーの生成がいるかも

```
php artisan key:generate
```

## コマンドのメモ書き

開発サーバ実行

```
php artisan serve
```

フロントエンドも一緒に

```
npm run dev
```

上記を同時にできるかも

```
composer run dev
```

DB リセットして Seeder 実行

```
php artisan migrate:fresh --seed
```

## フロントエンドのルーティングについて。

route("name のほうをいれる")

## ビューのイメージ

タスクビューでは、ツリービューと詳細ビューがある？
ツリービューは分解するためのビュー。詳細ビューはログを取るためのビュー。
実行コンテクストも詳細ビュー。
