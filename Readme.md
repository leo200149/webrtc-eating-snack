# 貪食蛇純js + webrtc連線

https://leo200149.github.io/webrtc-eating-snack/index.html

## 單機

開啟`一個`瀏覽器

`自己`當主機，點選`HOST`，點選`START`

## 連線

開啟`兩個`瀏覽器

`第一個`當主機，點選`HOST` 產生`hostkey`

範例如下

```js
p1:eyJ0eXBlIjoib2.........
```

`第二個`當client，將主機`hostkey`貼進key欄位後，點選`CLIENT` 產生 `clientkey`

範例如下

```js
p1:eyJ0eXBlIjssdfb2.........
```

將`clientkey`貼回`第一個`瀏覽器key後，點選`ADD CLIENT`，成功後，會印出`CONNECT`

點選`START`即可開始。