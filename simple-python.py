from flask import Flask, render_template
import os
import json
import psycopg2
import pandas as pd
import re
import numpy as np
from sqlalchemy import create_engine
import sys  # import sys package, if not already imported
reload(sys)
sys.setdefaultencoding('utf-8')

app = Flask(__name__)

port = None
vcap = None
jdbc_uri = None
database_name = None
username = None
password_str = None
db_host = None
db_port = None
connected = False
conn = None
cur = None

### Application Configuration
portStr = os.getenv("VCAP_APP_PORT")

if portStr is not None:
    port = int(portStr)

services = os.getenv("VCAP_SERVICES")

if services is not None:
    vcap = json.loads(services)

if vcap is not None:
    postgres = vcap['postgres'][0]['credentials']
    if postgres is not None:
        jdbc_uri = postgres['jdbc_uri']
        database_name = postgres['database']
        username = postgres['username']
        password_str = postgres['password']
        db_host = postgres['host']
        db_port = postgres['port']
else:
    database_name = '<DATABASE_NAME>'
    username = '<USERNAME>'
    password_str = '<PASSWORD>'
    db_host = 'localhost'
    db_port = 5432

try:
    conn = psycopg2.connect(database=database_name, user=username, password=password_str, host=db_host, port=db_port)
    connected = True
    cur = conn.cursor()
except:
    connected = False

@app.route("/")
def index():
    return render_template("index.html")

### Main api - GET - provides connection info
#@app.route('/')
@app.route("/Rossman/data/sample")
#def main():
def fetch():
    response = 'hello'

    query = """
    SELECT * FROM train
    LEFT JOIN
    (SELECT * FROM store
    LEFT JOIN storename
    USING(Store)) a
    USING(Store)
    WHERE Store <= 115 AND Open = 1
    """
    cols =["unnamed: 0", "store", "storename", "dayofweek", "date", "sales",
           "customers", "open", "promo", "stateholiday", "schoolholiday",
           "storetype", "assortment", "competitiondistance",
           "competitionopensincemonth", "competitionopensinceyear",
           "promo2", "promo2sinceweek",	"promo2sinceyear", "promointerval"]

    engine = create_engine('postgresql://u6b5dfc3b32434491becff58be1490a97:d23b2f2056f0439fae6c128bcfd2abdd@10.72.6.143:5432/da72204a1b15746c7a2cfeb316430deb6')
    #data = pd.read_sql_query(query, engine)
    data = pd.read_sql(query, engine)

    assort = {"a": "Basic", "c": "Extended"}
    stype = {"a": "Cart", "b": "Kiosk", "c": "Branch", "d": "Outlet"}
    data['assortment'] = [assort[x] for x in data.assortment]
    data['storetype'] = [stype[x] for x in data.storetype]
    data["unnamed: 0"] = np.add(range(len(data)),1)
    data = data[cols]
    for i in data.columns:
        data[i][data[i].apply(lambda x: True if re.search('^\s*$', str(x)) \
        else False)] = None
    data = data.fillna('NA')

    #print data
    return data.to_json(orient='records')

### Main application
if __name__ == '__main__':
    if port is not None:
        app.run(host='0.0.0.0', port=port)
    else:
        app.run()
