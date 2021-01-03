---
title: ""
date: "2020-12-16T06:40:32.169Z"
template: "post"
draft: false
slug: "$"
category: "development"
tags:
  - "Web Development"
  - "gcp"
description: ""
socialImage: "/media/42-line-bible.jpg"
---

# motivation
datastore に保存しているデータを気軽にdatastoreにimport できないからとおもいました。
いろいろ模索した結果、datastore → GCS → BigQuery で実現できたのでここにサンプルのスクリプトをはって置こうと思います。
後述で、解説をいれていきたいと思います。

ただ、今回のスクリプトはBigQueryのテーブルのパーテションなどは考慮していなく、datastoreにデータを毎日テーブルごと上書きしているような実装にしております。

# 背景
datastore の データをbigquery に挿入する処理を毎日したかったのですが、手軽にする方法がなかなかみつかりませんでした。
以下のような記事もあったのですが、実行環境


# agenda


```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"log"
	"net/http"
	"net/url"
	"os"

	cloudtasks "cloud.google.com/go/cloudtasks/apiv2"
	"github.com/joho/godotenv"
	"google.golang.org/api/bigquery/v2"
	"google.golang.org/api/datastore/v1"
	taskspb "google.golang.org/genproto/googleapis/cloud/tasks/v2"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// DatastoreExportRawMessage is
type DatastoreExportRawMessage struct {
	Metadata *datastore.GoogleDatastoreAdminV1beta1ExportEntitiesMetadata `json:"metadata"`
	Name     string                                                       `json:"name"`
}

func main() {
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/export_from_datastore_to_storage", exportDatastoreHandler)
	http.HandleFunc("/load_from_storage_to_bigquery", loadBigqueryHandler)

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to port %s", port)
	}

	log.Printf("Listening on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
}

func exportDatastoreHandler(w http.ResponseWriter, r *http.Request) {

	projectID := os.Getenv("GCP_PROJECT_ID")
	ctx := context.Background()
	q := r.URL.Query()

	if q == nil || len(q["kind"]) == 0 || len(q["outputUrlPrefix"]) == 0 {
		http.Error(w, "kind and outputUrlPrefix parameter is needed", http.StatusInternalServerError)
		return
	}

	datastoreService, err := datastore.NewService(ctx)

	entityFilter := datastore.GoogleDatastoreAdminV1EntityFilter{Kinds: q["kind"]}
	req := datastore.GoogleDatastoreAdminV1ExportEntitiesRequest{OutputUrlPrefix: q["outputUrlPrefix"][0], EntityFilter: &entityFilter}

	op, err := datastoreService.Projects.Export(projectID, &req).Context(ctx).Do()

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	body, err := op.MarshalJSON()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var rawData DatastoreExportRawMessage
	if err := json.Unmarshal(body, &rawData); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

    urlStr := fmt.Sprintf("%s/load_from_storage_to_bigquery", os.Getenv("TARGET_DOMAIN"))
	taskRelativeURL, err := url.Parse(urlStr)
	if err != nil {
		return
	}
	params := url.Values{}
	params.Add("table_id", q["kind"][0])
	params.Add("project_id", projectID)
	params.Add("dataset_id", q["dataset_id"][0])
	params.Add("output_url", rawData.Metadata.OutputUrlPrefix)
	params.Add("name", fmt.Sprintf("/all_namespaces/kind_%s/all_namespaces_kind_%s.export_metadata", q["kind"][0], q["kind"][0]))
	taskRelativeURL.RawQuery = params.Encode()
	_, err = createAppEngineTask(ctx, taskRelativeURL.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(op.HTTPStatusCode)
	w.Write(body)
}

func loadBigqueryHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	outputURL := q.Get("output_url")
	tableID := q.Get("table_id")
	projectID := q.Get("project_id")
	datasetID := q.Get("dataset_id")
	name := q.Get("name")

	gcsURI := outputURL + name

	ctx := context.Background()

	// Creates a client.
	bigqueryService, err := bigquery.NewService(ctx)

	if err != nil {
		fmt.Fprint(w, err)
		return
	}

	tableRef := bigquery.TableReference{
		DatasetId: datasetID,
		TableId:   tableID,
		ProjectId: projectID,
	}

	jobConfLoad := bigquery.JobConfigurationLoad{
		DestinationTable: &tableRef,
		WriteDisposition: "WRITE_TRUNCATE",
		SourceUris:       []string{gcsURI},
		SourceFormat:     "DATASTORE_BACKUP",
	}

	jobConf := bigquery.JobConfiguration{Load: &jobConfLoad}
	job := bigquery.Job{Configuration: &jobConf}
	res, err := bigqueryService.Jobs.Insert(projectID, &job).Context(ctx).Do()

	if err != nil {
		fmt.Fprint(w, err)
		return
	}
	body, err := res.MarshalJSON()
	w.Write(body)
}

func createAppEngineTask(ctx context.Context, url string) (*taskspb.Task, error) {
	if url == "" {
		msg := "relative Uri is empty"
		log.Println(msg)
		return nil, errors.New(msg)
	}

	client, err := cloudtasks.NewClient(ctx)
	if err != nil {
		log.Printf("err %v", err)
		return nil, err
	}

	// Build the Task queue path.
	queuePath := fmt.Sprintf("projects/%s/locations/%s/queues/%s", os.Getenv("GCP_PROJECT_ID"), "asia-northeast1", "appEngineTask")

	// Build the Task payload.
	// https://godoc.org/google.golang.org/genproto/googleapis/cloud/tasks/v2#CreateTaskRequest
	req := &taskspb.CreateTaskRequest{
		Parent: queuePath,
		Task: &taskspb.Task{
			// https://godoc.org/google.golang.org/genproto/googleapis/cloud/tasks/v2#AppEngineHttpRequest
			MessageType: &taskspb.Task_HttpRequest{
				HttpRequest: &taskspb.HttpRequest{
					HttpMethod: taskspb.HttpMethod_GET,
					Url:        url,
				},
			},
			ScheduleTime: timestamppb.New(time.Now().Add(time.Minute * 5)),
		},
	}

	createdTask, err := client.CreateTask(ctx, req)
	if err != nil {
		log.Printf("err %v", err)
	}

	return createdTask, nil
}
```
