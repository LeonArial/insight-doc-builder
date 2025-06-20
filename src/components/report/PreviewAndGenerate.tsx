import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ReportData } from './types';

interface PreviewAndGenerateProps {
  reportData: ReportData;
  isGenerating: boolean;
  generateReport: () => void;
}

const getRiskColor = (risk: string) => {
  if (risk === '高危') return 'bg-red-600';
  if (risk === '中危') return 'bg-yellow-500';
  return 'bg-green-500';
};

const PreviewAndGenerate: React.FC<PreviewAndGenerateProps> = ({ reportData, isGenerating, generateReport }) => (
  <Card className="bg-slate-800/50 backdrop-blur border-slate-700 text-white">
    <CardHeader>
      <CardTitle>预览与生成</CardTitle>
      <CardDescription className="text-slate-300">
        请在下方预览报告的关键信息，确认无误后点击生成按钮。
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-slate-300"><strong className="text-white">系统名称:</strong> {reportData.systemName}</div>
            <div className="text-slate-300"><strong className="text-white">报告日期:</strong> {reportData.reportDate}</div>
            <div className="text-slate-300"><strong className="text-white">IP/域名:</strong> {reportData.ipOrDomain}</div>
            <div className="text-slate-300"><strong className="text-white">测试范围:</strong> {reportData.testDateRange}</div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-300"><strong className="text-white">对接人员:</strong> {reportData.contactName}</div>
            <div className="text-slate-300"><strong className="text-white">对接电话:</strong> {reportData.contactPhone}</div>
            <div className="text-slate-300"><strong className="text-white">测试人员:</strong> {reportData.testerName}</div>
            <div className="text-slate-300"><strong className="text-white">测试电话:</strong> {reportData.testerPhone}</div>
          </div>
          <div className="md:col-span-2 text-slate-300"><strong className="text-white">测试账号:</strong> {reportData.testAccount}</div>
        </div>

        <Separator className="bg-slate-600" />

        <div>
          <h3 className="text-lg font-semibold mb-3">发现的漏洞 ({reportData.vulnerabilities.length})</h3>
          {reportData.vulnerabilities.length > 0 ? (
            <div className="space-y-4">
              {reportData.vulnerabilities.map((vuln, index) => (
                <div key={vuln.id} className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${getRiskColor(vuln.riskLevel)} text-white`}>{vuln.riskLevel}</Badge>
                    <span className="font-medium text-base">{index + 1}. {vuln.name}</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-1"><strong className="text-slate-100">风险描述:</strong> {vuln.description}</p>
                  <p className="text-slate-300 text-sm"><strong className="text-slate-100">整改建议:</strong> {vuln.advice}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 text-slate-400 text-sm">
              <p>暂未添加任何漏洞信息。请在“漏洞管理”选项卡中添加。</p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button onClick={generateReport} disabled={isGenerating} className="w-full text-lg py-6 bg-green-600 hover:bg-green-700">
            {isGenerating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> 正在生成...</>
            ) : (
              <><Download className="mr-2 h-5 w-5" /> 生成并下载报告</>
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default PreviewAndGenerate;
