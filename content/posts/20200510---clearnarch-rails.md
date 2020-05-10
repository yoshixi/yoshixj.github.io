---
title: "[WIP]railsとclearn archtecture"
date: "2020-01-01"
template: "post"
draft: false
slug: "20200510-rails-with-clearn-architecture"
category: "rails"
tags:
  - "blog"
description: ""
socialImage: "/media/42-line-bible.jpg"
---

# motivation
最近、アーキテクチャについて関心が深まってきたので調べる。

僕の下調べ情報によると、近年MicroServiceが流行ってきたことがあり、Rails の全部入りのMVCのようなものが適していないのではないかという話が上がっているように感じている。
Goの薄いフレームワークが流行るのも、Micro Serviceを考えやすいからのような考察もあった。

また、Railsで開発していくと、全部入りのアプリケーションになってしまうことが多く、Classの責務などが曖昧になり、FatなClassが生まれてしまうという議論をよく見けてきた。

それを避けるためには、Layer(層)を設けて、Layerごとの責務を明確にするべき。そしてそのLayer Archtectureで今流行っているのがClearnArchtectureという認識を僕は持っている。

今後、Railsの開発において、アーキテクチャとどのように向き合って行くべきなのかを考察するべく、ClearnArchtecture X Railsというテーマで調査する。


# memo
- railsに足りないのは、ModelとControllerの間のlayer


2019年の記事。比較的新し目。[ソースコード](https://github.com/lukemorton/space)をみると、presenter層を入れている。
[Why take a Clean Architecture approach to Rails?](https://lukemorton.tech/articles/why-take-a-clean-architecture-approach-to-rails)


DDDでのサービス層という名前があるっぽい
https://gist.github.com/blaix/5764401


hanamiはclearnArchtectureにinspireされているっぽいので使ってみたい
http://hanamirb.org/

少し前だが、結局 controllerとmodelの間に層を一個いれたいようねって話で[Trailblazer](https://github.com/trailblazer/trailblazer)gemを使ったという話。
https://qiita.com/kbaba1001/items/e265ad1e40f238931468


https://goiabada.blog/interactors-in-ruby-easy-as-cake-simple-as-pie-33f66de2eb78
https://guides.hanamirb.org/architecture/interactors/#creating-our-interactor

Interactorで使えるgem
https://github.com/collectiveidea/interactor
https://github.com/trailblazer/trailblazer

気をつけるべきは、Services層が何でも屋にならないこと。
ActiveModel::Concernに切り出すのが良さげ。
https://techracho.bpsinc.jp/hachi8833/2018_04_16/55130