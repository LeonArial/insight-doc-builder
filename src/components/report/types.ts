export interface VulnerabilityData {
  id: string;
  riskLevel: '高危' | '中危' | '低危';
  name: string;
  description: string;
  process: string;
  advice: string;
  images?: File[];
}

export interface ReportData {
  systemName: string;
  reportDate: string;
  ipOrDomain: string;
  testDateRange: string;
  contactName: string;
  contactPhone: string;
  testerName: string;
  testerPhone: string;
  testAccount: string;
  vulnerabilities: VulnerabilityData[];
}
