#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function
import sys, json, os, time, io


def respond(payload):
    print(json.dumps(payload, ensure_ascii=False), end='')


def ensure_dir(path):
    if not os.path.isdir(path):
        os.makedirs(path)


def main():
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except Exception:
        respond({'ok': False, 'error': 'invalid json'})
        return
    base = os.path.join(os.path.dirname(os.path.dirname(__file__)), '海缆数据', '重构的数据')
    ensure_dir(base)
    items = []
    if isinstance(data, dict) and isinstance(data.get('items'), list):
        items = data['items']
    elif isinstance(data, list):
        items = data
    saved_at = int(time.time() * 1000)
    payload = {'version': 1, 'savedAt': saved_at, 'items': list(items)}
    path = os.path.join(base, '3d海缆数据.json')
    with io.open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False)
    respond({'ok': True, 'path': path})


if __name__ == '__main__':
    main()
