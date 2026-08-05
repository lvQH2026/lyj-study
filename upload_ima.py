#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用 IMA 返回的临时凭证把归档 HTML 上传到 COS。"""
import sys, json
from qcloud_cos import CosConfig, CosS3Client

cred = json.load(open(r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站PWA\cos_cred.json", encoding="utf-8"))
local = r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站归档\吕泳冀学习站.html"

config = CosConfig(
    Region=cred["region"],
    SecretId=cred["secret_id"],
    SecretKey=cred["secret_key"],
    Token=cred["token"],
)
client = CosS3Client(config)

with open(local, "rb") as fp:
    resp = client.put_object(
        Bucket=cred["bucket_name"],
        Body=fp,
        Key=cred["cos_key"],
        ContentType="text/html",
    )
print("ETag:", resp.get("ETag"))
print("UPLOAD_OK")
