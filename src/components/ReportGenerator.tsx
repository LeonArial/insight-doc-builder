import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ReportData, VulnerabilityData } from './report/types';
import ReportHeader from './report/ReportHeader';
import BasicInfoForm from './report/BasicInfoForm';
import ContactInfoForm from './report/ContactInfoForm';
import VulnerabilityManager from './report/VulnerabilityManager';
import PreviewAndGenerate from './report/PreviewAndGenerate';
import API_CONFIG from '@/config';

const ReportGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVulnerability, setCurrentVulnerability] = useState<Omit<VulnerabilityData, 'id'>>({
    riskLevel: '中危',
    name: '',
    description: '',
    process: '',
    advice: ''
  });
  const [reportData, setReportData] = useState<ReportData>({
    systemName: '',
    reportDate: new Date().toISOString().split('T')[0],
    sDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    ipOrDomain: '',
    testDateRange: '',
    contactName: '',
    contactPhone: '',
    testerName: '',
    testerPhone: '',
    testAccount: '',
    vulnerabilities: []
  });

  const generateReport = async () => {
    setIsGenerating(true);
    const payload = {
      ...reportData,
      vulnerabilities: reportData.vulnerabilities.map(vuln => ({
        risk: vuln.riskLevel,
        name: vuln.name,
        description: vuln.description,
        advice: vuln.advice,
        process: { text: vuln.process, image_path: "" }
      }))
    };

    try {
            const response = await fetch(`${API_CONFIG.baseURL}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成报告失败，请检查后端服务');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      // console.log(contentDisposition);
      let filename = `${reportData.systemName || '渗透测试报告'}.docx`;
      if (contentDisposition) {
        // 优先尝试解析 filename* (RFC 5987 编码, 支持Unicode)
        const filenameStarMatch = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch (e) {
            console.error('Error decoding filename*:', e);
            // 解码失败时回退，处理带引号和不带引号的情况
            const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/"/g, ''); // 移除可能的引号
            }
          }
        } else {
          // 回退到解析简单的 filename，处理带引号和不带引号的情况
          const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/"/g, ''); // 移除可能的引号
          }
        }
      }
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "报告已生成", description: "渗透测试报告已成功开始下载。" });
    } catch (error: any) {
      console.error('生成报告时出错:', error);
      toast({ title: '生成失败', description: error.message || '发生未知错误。', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-700 via-blue-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <ReportHeader />
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur">
            <TabsTrigger value="basic" className="text-white data-[state=active]:bg-blue-600">基本信息</TabsTrigger>
            <TabsTrigger value="contact" className="text-white data-[state=active]:bg-blue-600">人员信息</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="text-white data-[state=active]:bg-blue-600">漏洞管理</TabsTrigger>
            <TabsTrigger value="preview" className="text-white data-[state=active]:bg-blue-600">预览生成</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoForm reportData={reportData} setReportData={setReportData} />
          </TabsContent>

          <TabsContent value="contact">
            <ContactInfoForm reportData={reportData} setReportData={setReportData} />
          </TabsContent>

          <TabsContent value="vulnerabilities">
            <VulnerabilityManager 
              reportData={reportData} 
              setReportData={setReportData} 
              currentVulnerability={currentVulnerability}
              setCurrentVulnerability={setCurrentVulnerability}
            />
          </TabsContent>

          <TabsContent value="preview">
            <PreviewAndGenerate reportData={reportData} isGenerating={isGenerating} generateReport={generateReport} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportGenerator;
