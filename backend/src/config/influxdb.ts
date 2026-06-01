import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { OrgsAPI, BucketsAPI } from '@influxdata/influxdb-client-apis';
import { config } from 'dotenv';

config();

const url = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN || 'farm-admin-token-2026';
const org = process.env.INFLUX_ORG || 'farm_org';
const bucket = process.env.INFLUX_BUCKET || 'farm_management';

export const influxDB = new InfluxDB({ url, token });
export const writeApi = influxDB.getWriteApi(org, bucket, 'ns');
export const queryApi = influxDB.getQueryApi(org);

export const influxConfig = {
  url,
  token,
  org,
  bucket,
};

export async function createBucketIfNotExists() {
  try {
    const bucketsApi = new BucketsAPI(influxDB);
    const buckets = await bucketsApi.getBuckets();
    const existingBucket = buckets.buckets?.find((b) => b.name === bucket);
    
    if (!existingBucket) {
      await bucketsApi.postBuckets({
        body: {
          orgID: org,
          name: bucket,
          retentionRules: [
            {
              type: 'expire',
              everySeconds: 31536000, // 1 year
            },
          ],
        },
      });
      console.log(`[INFO] Created InfluxDB bucket: ${bucket}`);
    }
  } catch (error) {
    console.error('[ERROR] Failed to create InfluxDB bucket:', error);
  }
}
