---
title: RailsでAPI開発環境を設定する。
date: "2020-04-13"
template: "post"
draft: false
slug: "rails-new"
category: "development"
tags:
  - "rails"
description: "久し振りに、rails newをした。初期の設定で何をすればよいか迷ってしまったので、ここに残して置こうと思う。
今回の想定はrailsでAPIを作成する場合を想定。
localの開発環境はdocker-composeを想定。"
socialImage: "/media/42-line-bible.jpg"
---

# motivation

Hi, I'm yoshiki. Japanese rails engineer.
The other day, I was going to develop new product api by rails.

At the time, I was not sure what to do with initial rails setup, so I noted this.
In this case, I use api mode of rails and docker-compose for local development environment.



# agenda
- make git repository
- make Gemfile
- set docker
- execute rails new
- set rubocop
- install rspec
- install factry bot
- set timezone

# make git repository
Development began with the github repositriry.
When you setup rails by `rails new` command, git was setted automatically.
In this case, I avoid that.

Pull git repository that only contains `.git`.
```sh
$ git pull repository_name
$ cd repository_name
$ ls -al

drwxr-xr-x  14 yoshikimasubuchi  staff       448  5  2 11:08 .git
```

# set docker

The directory strucure shoud match the team.
The directory structure of docker-compose files I experimentd is as follows.

**docker contains rails application only**
```
--api
  ├── Gemfile
  ├── docker-compose.yml
  ├── app
  ├── container
      ├── Dockerfile
```


**docker contains rails and front-end application**
```
--docker-compose.yml
  ├── Dockerfile.api
  ├── Dockerfile.front
  ├── api
  │   ├── Gemfile
  │   └── app
  │
  ├── front
  │   ├── package.json
```

I chouse first pattern containing rails application only.
Dockerfile and docker-compose.yml codes is as follows.

~~~Dockerfile
FROM ruby:2.7.1
ENV LANG C.UTF-8
ENV TZ Asia/Tokyo

RUN apt-get update -qq && apt-get install -y \
    build-essential \
    nodejs \
 && rm -rf /var/lib/apt/lists/*

ENV ENTRYKIT_VERSION 0.4.0
RUN wget https://github.com/progrium/entrykit/releases/download/v${ENTRYKIT_VERSION}/entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz \
  && tar -xvzf entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz \
  && rm entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz \
  && mv entrykit /bin/entrykit \
  && chmod +x /bin/entrykit \
  && entrykit --symlink

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN gem install bundler

ENTRYPOINT [ \
    "prehook", "ruby -v", "--", \
    "prehook", "bundle install -j3 --quiet", "--"]
~~~

~~~docker-compose.yml
version: '3'
services:
  db:
    image: postgres:11.3
    ports:
      - "5432:5432"
    volumes:
      - db:/var/lib/postgresql/data:z
  api:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/usr/src/app
    command: /bin/sh -c "rm -f /usr/src/app/tmp/pids/server.pid && bundle exec rails s -p 8080 -b '0.0.0.0'"
    ports:
      - "8080:8080"
    depends_on:
      - db
    env_file:
      - rails.env
    environment:
      - DB_USER=postgres
      - DB_PASS=
      - DB_HOST=db
      - DB_PORT=5432
      # for ruby 2.6 alart https://k-koh.hatenablog.com/entry/2020/02/07/145957
      # - RUBYOPT='-W:no-deprecated -W:no-experimental'
    tty: true
    stdin_open: true

volumes:
   db:
~~~

# set Gemfile and install rails
Set Gemfile using dokcer-compose to install rails.

```sh
$ docker-compose build
$ docker-compose run api bundle init
```

bundle init make Gemfile.
add `gem 'rails'` to Gemfile.

~~~Gemfile
# frozen_string_literal: true

source 'https://rubygems.org'

git_source(:github) { |repo_name| "https://github.com/#{repo_name}" }

gem 'rails'
~~~

execute bundle install.
`--path` option set up to your liking.

```sh
$ docker-compose run api bundle install --path vendor/bundle
```

Rails has installed in docker!
Add bundle config as you like.

~~~.bundle/config
---
BUNDLE_PATH: vendor/bundle
BUNDLE_JOBS: 4
BUNDLE_DISABLE_SHARED_GEMS: '1'
~~~


# rails new
We have an environm
ようやくrails newをします。
今回はAPIモードで`rails new` を行います。
今回はテストフレームワークにrspecを使用するので、 `--skip-test` します。
以下以外でも `active-strage` などもskipできるますが、もしかしたら使うかもしれないのでskipしません。

```
$ docker-compose run api bundle exec rails new . --api -d=postgresql --skip-git --skip-test --api --skip-bundle
```

`rails new` でアプリができたら、Gemfileを記述していきます。

~~~Gemfile
# frozen_string_literal: true

source 'https://rubygems.org'

git_source(:github) { |repo_name| "https://github.com/#{repo_name}" }

ruby '2.7.1'

gem 'rails'

gem 'puma', '~> 3.11'
gem 'bootsnap', '>= 1.4.2', require: false
gem 'rack-cors'
gem 'pg'

group :development, :test do
  gem 'brakeman' # for security
  gem 'dotenv-rails'
  gem 'guard-rspec', require: false
  gem 'rspec-benchmark'
  gem 'rspec-rails'
  gem 'rspec_junit_formatter'
  gem 'rubocop'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'faker-japanese'
  gem 'pry-rails'
  gem 'pry-byebug'
end

group :development do
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'hirb'
end
~~~


```
$ docker-compose run api bundle
```

DBの設定も書いていきます。

~~~database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: <%= ENV['DB_USER'] %>
  password: <%= ENV['DB_PASS'] %>
  host: <%= ENV.fetch('DB_HOST') { 'localhost' } %>
  port: <%= ENV.fetch('DB_PORT') { 5432 } %>

development:
  <<: *default
  database: earlybird-api_development

test:
  <<: *default
  database: earlybird-api_test
production:
  <<: *default
  database: earlybird-api_production
  username: earlybird-api
  password: <%= ENV['earlybird-api_DATABASE_PASSWORD'] %>
~~~

defaultの部分の設定は `docker-compose.yml`の記述にあわせます。

```
$ docker-compose run api bundle exec rails db:create
```

これで、railsでAPIを作れる状態になりました!

# setting rubocop
チーム開発でrubocopをちゃんと設定することは重要です。
会社でrubyのプロジェクトがなかった場合は、こんな感じで設定しておきます。

```.rubocop.yml
require: rubocop-rails

Rails:
  Enabled: true

AllCops:
  TargetRubyVersion: 2.7.3
  TargetRailsVersion: 6.0.2
  Exclude:
    - bin/*
    - db/**/*
    - vendor/**/*
    - test/**/*
    - config/**/*
    - lib/**/*
    - Gemfile
    - db/schema.rb
```

[rubocop-rails](https://github.com/rubocop-hq/rubocop-rails)

# install rspec
rspecをinstallします。
最初にinstallをし忘れると、modelのspecやら、controllerのspecやら、自動でつくられないのであとあと面倒になります。

```
$ docker-compose run api bundle exec rails generate rspec:install
```

# install factry bot
factory botもinstallし忘れると、modelを作成と同時にfileが作られないので、あとあと面倒になります。

~~~spec/rails_helper.rb
RSpec.configure do |config|
  config.fixture_path = "#{::Rails.root}/spec/fixtures"
  config.include FactoryBot::Syntax::Methods # add
~~~

# timezoneの設定
- ruby プロセスのタイムゾーン
- config.time_zone
- config.active_record.default_timezone
- DBサーバ（postgres等）のタイムゾーン

の設定をします。

```
ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
```

```config/application.rb
config.time_zone = 'Tokyo'
config.active_record.default_timezone = :local
```

```DB
set time zone 'Asia/Tokyo';

-- postgresql.conf に timezone='Japan' も記載
```

コーディングで時間を扱う際には、`TimeWithZone`を使用するようにします。

[参考](https://qiita.com/aosho235/items/a31b895ce46ee5d3b444)
