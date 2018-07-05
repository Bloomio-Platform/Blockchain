import json

f = open("..\\src\\contracts.json");
sss = f.read();
f.close()
o = json.loads(sss)
contracts = o['contracts']
o2 = dict({'contracts':dict( (x.split(':')[1], contracts[x]) for x in contracts.keys())})
sss = json.dumps(o2, indent = 2);
f = open("..\\src\\contracts.json", "w");
f.write(sss);