---
title: "時間の使い方について"
date: "2020-04-13T06:40:32.169Z"
template: "post"
draft: true
slug: "$"
category: "dialy"
tags:
  - "blog"
description: "時間の使い方について"
socialImage: "/media/42-line-bible.jpg"
---

# motivation

## summery

# アーキテクチャの目的

求められているシステムの構築、保守のために必要な人を最小限にするため

再構築したいと思った時にどうするか？
> 早く進む唯一の方法は、うまくすすむことである。

> 自身過剰による再設計は、もとプロジェクトと同じように崩壊する

構造化プログラミング→goto文に警告
OOプログラミング→ポインタ
関数プログラミング→代入

総括(あんまり理解できていない)
OOは、ネームスペースが分けられるから、プラグインを使えるようになったということは理解した。
- 構造化プログラミングは制御の移行に規律
- オブジェクト指向は、関節的な制御の移行に規律
- 関数型は、代入に起立

# 構造化プログラミング
Dijkstraさん
- オランダ初のプログラマー
- オランダはプログラマーを受け入れようとしなかった
- 理論物理学者の肩書で、プログラマーをやっていた。


プログラマーは順次、選択、反復の構造でできる。

## テスト
テストはバグが存在するものを示すわけではなく、バグが存在することを示すものである。

正しくないことの証明をして、再帰的に正しいことを証明することである。

# オブジェクト指向プログラミング
Cのプログラムのところがあまり理解できなかった。

カプセル化と継承はCでもできた
ポリモフィズムだけは、ポインターを使用しないといけない。
その規約をプログラマーが覚えていない限り、バグを追跡することができなかった。

それをポインターを排除できたのが、ポリモフィズムという理解。
OOとはポリモーフィズムを使用することで、システムにある陶b手のソースコードの依存関係を絶対的に制御する能力。
→ プラグインアーキテクチャを使用することができる。

# 3章 設計の原則

- solid 原則
  - Single Responsibility Principle (単一責任)
  - Open Closed Principle(既存のコードの変更よりも、新しいコードの追加によって広めるべき)
  - Liskv Substitution Principle (リスコフの置換原則)
  - Interface Segregation Peinciple(インターフェイス分離原則)
  - Dependency Inversion Principle(依存関係逆転の原則)

## Single Responsibility Principle
module は single actor に対して responsibilty を持つべき(actor who want to user system)

### problem
1 想定外の重複
employeeが例。労働時間、それに対する給与、確定の3つのmethodがあったときに、それのresposibilityをもつactorは違う。
actorの異なるコードは分割するべき。

2 マージ
actorがちがうと、同じソースファイルをいじらないといけなくなる。

### solution
facede pattern
- methodだけ定義して、処理は別classに譲る
- facede pattern で処理が委譲されたクラスは、private methodが多くなるだろう。

## OCP
Interactor は ビジネスルールを含む、最上位概念。
使用の関係と、実装や継承の関係

## LSP
## ISP
- 動的言語はInterfaceで型が推論されるのであまり語られない
- 静的言コンパイ考えると、Interfaceを分離していないと、buildする時に全部buildすることになる

## DIP
- ソースコードの依存は、抽象でするべき
- 依存関係の向きを注意する

# コンポーネント原則

##　コンポーネント凝集性
- 再利用・リリース等価の原則(REP)
- 閉鎖性共通の原則
- 全再利用の原則


