export type BacRegion = 'ng' | 'za' | 'eu';

export interface RegionConfig {
  label: string;
  sdxBaseUrl: string;
  platformBaseUrl: string;
}

export const regionConfig: Record<BacRegion, RegionConfig> = {
  ng: {
    label: 'Nigeria',
    sdxBaseUrl: 'http://localhost:8080',
    platformBaseUrl: 'http://localhost:8081',
  },
  za: {
    label: 'South Africa',
    sdxBaseUrl: 'http://localhost:8180',
    platformBaseUrl: 'http://localhost:8181',
  },
  eu: {
    label: 'Europe',
    sdxBaseUrl: 'http://localhost:8280',
    platformBaseUrl: 'http://localhost:8281',
  },
};
