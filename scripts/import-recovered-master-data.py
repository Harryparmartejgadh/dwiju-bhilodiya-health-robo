#!/usr/bin/env python3
"""Import recovered ORIGINAL Dwiju datasets without overwriting existing data."""
import json, pathlib, sys, zipfile, hashlib
root=pathlib.Path(__file__).resolve().parents[1]
archive=pathlib.Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if not archive or not archive.is_file():
    raise SystemExit("Usage: python scripts/import-recovered-master-data.py /path/to/DWIJU_MASTER_DATA_RECOVERED_4410_75867.zip")
names={"features":("data/features.json",4410),"benefits":("data/benefits.json",75867)}
with zipfile.ZipFile(archive) as z:
    staged={}
    for label,(name,count) in names.items():
        data=z.read(name)
        rows=json.loads(data)
        if not isinstance(rows,list) or len(rows)!=count: raise SystemExit(f"{label}: wrong row count")
        ids=[str(r.get("id","")) for r in rows]
        if any(not x for x in ids) or len(set(ids))!=len(ids): raise SystemExit(f"{label}: missing/duplicate IDs")
        staged[label]=(name,data,rows)
    features=staged["features"][2];benefits=staged["benefits"][2]
    feature_ids={str(x["id"]) for x in features}
    if any(not str(x.get("name","")).strip() for x in features): raise SystemExit("empty feature name")
    if any(str(x.get("featureId","")) not in feature_ids or not str(x.get("gujaratiBenefit","")).strip() for x in benefits): raise SystemExit("invalid benefit reference or text")
    if {str(x["featureId"]) for x in benefits} != feature_ids: raise SystemExit("some features lack benefits")
    for label,(name,data,_) in staged.items():
        target=root/name
        if target.exists():
            if target.read_bytes()!=data: raise SystemExit(f"REFUSING to overwrite existing {name}")
            print(f"UNCHANGED {name}")
        else:
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
            print(f"IMPORTED {name} bytes={len(data)} sha256={hashlib.sha256(data).hexdigest()}")
print("IMPORT VALIDATED: 4410 features, 75867 benefits, referential integrity PASS")
