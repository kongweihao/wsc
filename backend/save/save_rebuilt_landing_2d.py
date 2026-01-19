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
    ap_items = []
    if isinstance(data, dict):
        if isinstance(data.get('ap'), list):
            ap_items = data['ap']
        elif isinstance(data.get('items'), list):
            ap_items = data['items']
    elif isinstance(data, list):
        ap_items = data
    standard_items = []
    if isinstance(data, dict) and isinstance(data.get('standard'), list):
        standard_items = data['standard']
    if not standard_items:
        standard_items = ap_items
    saved_at = int(time.time() * 1000)

    def write_file(path, items):
        payload = {'version': 1, 'savedAt': saved_at, 'items': list(items)}
        with io.open(path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False)

    ap_path = os.path.join(base, '2d亚太中心登陆站数据.json')
    std_path = os.path.join(base, '2d标准地图登陆站数据.json')
    write_file(ap_path, ap_items)
    write_file(std_path, standard_items)
    respond({'ok': True, 'paths': {'ap': ap_path, 'standard': std_path}})


if __name__ == '__main__':
    main()
