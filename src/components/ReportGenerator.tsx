
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Shield, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VulnerabilityData {
  id: string;
  riskLevel: '高危' | '中危' | '低危';
  name: string;
  description: string;
  process: string;
  advice: string;
  images?: File[];
}

interface ReportData {
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

const ReportGenerator = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    systemName: '',
    reportDate: '',
    ipOrDomain: '',
    testDateRange: '',
    contactName: '',
    contactPhone: '',
    testerName: '',
    testerPhone: '',
    testAccount: '',
    vulnerabilities: []
  });

  const [currentVulnerability, setCurrentVulnerability] = useState<Omit<VulnerabilityData, 'id'>>({
    riskLevel: '中危',
    name: '',
    description: '',
    process: '',
    advice: '',
    images: []
  });

  const addVulnerability = () => {
    if (currentVulnerability.name && currentVulnerability.description) {
      const newVulnerability: VulnerabilityData = {
        ...currentVulnerability,
        id: Date.now().toString()
      };
      setReportData(prev => ({
        ...prev,
        vulnerabilities: [...prev.vulnerabilities, newVulnerability]
      }));
      setCurrentVulnerability({
        riskLevel: '中危',
        name: '',
        description: '',
        process: '',
        advice: '',
        images: []
      });
      toast({
        title: "漏洞已添加",
        description: "新的安全漏洞已成功添加到报告中"
      });
    }
  };

  const removeVulnerability = (id: string) => {
    setReportData(prev => ({
      ...prev,
      vulnerabilities: prev.vulnerabilities.filter(v => v.id !== id)
    }));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case '高危': return 'bg-red-600';
      case '中危': return 'bg-yellow-500';
      case '低危': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case '高危': return <AlertTriangle className="w-4 h-4" />;
      case '中危': return <Shield className="w-4 h-4" />;
      case '低危': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const generateReport = () => {
    // 生成基于你的模板占位符的报告内容
    let reportContent = `渗透测试报告

系统名称: ${reportData.systemName || '#SYSTEM#'}
报告编写日期: ${reportData.reportDate || '#DATA#'}
域名或IP地址: ${reportData.ipOrDomain || '#IP#'}
测试日期范围: ${reportData.testDateRange || '#DATARANGE#'}
对接人员姓名: ${reportData.contactName || '#DJNAME#'}
对接人员联系电话: ${reportData.contactPhone || '#DJPHONE#'}
测试人员姓名: ${reportData.testerName || '#CSNAME#'}
测试人员联系电话: ${reportData.testerPhone || '#CSPHONE#'}
测试账号或认证设施: ${reportData.testAccount || '#CSACCOUNT#'}

漏洞详情:
`;

    if (reportData.vulnerabilities.length > 0) {
      reportData.vulnerabilities.forEach((vuln, index) => {
        reportContent += `
${index + 1}. 漏洞危害级别: ${vuln.riskLevel}
   漏洞名称: ${vuln.name}
   漏洞风险描述: ${vuln.description}
   漏洞发现过程: ${vuln.process}
   漏洞整改建议: ${vuln.advice}
   `;
      });
    } else {
      reportContent += `
漏洞危害级别: #POCRISK#
漏洞名称: #POCNAME#
漏洞风险描述: #POCDISCRIBE#
漏洞发现过程: #POCPROCESS#
漏洞整改建议: #POCADVICE#
`;
    }

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.systemName || '渗透测试报告'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "报告已生成",
      description: "渗透测试报告已成功生成并开始下载"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">渗透测试报告生成器</h1>
          </div>
          <p className="text-blue-200 text-lg">基于自定义模板的专业渗透测试报告生成工具</p>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur">
            <TabsTrigger value="basic" className="text-white data-[state=active]:bg-blue-600">基本信息</TabsTrigger>
            <TabsTrigger value="contact" className="text-white data-[state=active]:bg-blue-600">人员信息</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="text-white data-[state=active]:bg-blue-600">漏洞管理</TabsTrigger>
            <TabsTrigger value="preview" className="text-white data-[state=active]:bg-blue-600">预览生成</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  系统基本信息
                </CardTitle>
                <CardDescription className="text-slate-300">
                  填写被测试系统的基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systemName" className="text-white">系统名称 (#SYSTEM#)</Label>
                    <Input
                      id="systemName"
                      value={reportData.systemName}
                      onChange={(e) => setReportData(prev => ({ ...prev, systemName: e.target.value }))}
                      placeholder="输入系统名称"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportDate" className="text-white">报告编写日期 (#DATA#)</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={reportData.reportDate}
                      onChange={(e) => setReportData(prev => ({ ...prev, reportDate: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipOrDomain" className="text-white">域名或IP地址 (#IP#)</Label>
                    <Input
                      id="ipOrDomain"
                      value={reportData.ipOrDomain}
                      onChange={(e) => setReportData(prev => ({ ...prev, ipOrDomain: e.target.value }))}
                      placeholder="输入域名或IP地址"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testDateRange" className="text-white">测试日期范围 (#DATARANGE#)</Label>
                    <Input
                      id="testDateRange"
                      value={reportData.testDateRange}
                      onChange={(e) => setReportData(prev => ({ ...prev, testDateRange: e.target.value }))}
                      placeholder="例如：2025/06/17-2025/06/19"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="testAccount" className="text-white">测试账号或认证设施 (#CSACCOUNT#)</Label>
                    <Input
                      id="testAccount"
                      value={reportData.testAccount}
                      onChange={(e) => setReportData(prev => ({ ...prev, testAccount: e.target.value }))}
                      placeholder="输入测试账号或使用的认证设施"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">人员联系信息</CardTitle>
                <CardDescription className="text-slate-300">
                  填写对接人员和测试人员的联系信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4">对接人员信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName" className="text-white">对接人员姓名 (#DJNAME#)</Label>
                      <Input
                        id="contactName"
                        value={reportData.contactName}
                        onChange={(e) => setReportData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="输入对接人员姓名"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone" className="text-white">对接人员联系电话 (#DJPHONE#)</Label>
                      <Input
                        id="contactPhone"
                        value={reportData.contactPhone}
                        onChange={(e) => setReportData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="输入对接人员联系电话"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
                <Separator className="bg-slate-600" />
                <div>
                  <h3 className="text-white font-medium mb-4">测试人员信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="testerName" className="text-white">测试人员姓名 (#CSNAME#)</Label>
                      <Input
                        id="testerName"
                        value={reportData.testerName}
                        onChange={(e) => setReportData(prev => ({ ...prev, testerName: e.target.value }))}
                        placeholder="输入测试人员姓名"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="testerPhone" className="text-white">测试人员联系电话 (#CSPHONE#)</Label>
                      <Input
                        id="testerPhone"
                        value={reportData.testerPhone}
                        onChange={(e) => setReportData(prev => ({ ...prev, testerPhone: e.target.value }))}
                        placeholder="输入测试人员联系电话"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">添加漏洞信息</CardTitle>
                <CardDescription className="text-slate-300">
                  记录发现的安全漏洞详细信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vulnName" className="text-white">漏洞名称 (#POCNAME#)</Label>
                    <Input
                      id="vulnName"
                      value={currentVulnerability.name}
                      onChange={(e) => setCurrentVulnerability(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="输入漏洞名称"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="riskLevel" className="text-white">漏洞危害级别 (#POCRISK#)</Label>
                    <Select
                      value={currentVulnerability.riskLevel}
                      onValueChange={(value) => setCurrentVulnerability(prev => ({ ...prev, riskLevel: value as any }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="高危">高危</SelectItem>
                        <SelectItem value="中危">中危</SelectItem>
                        <SelectItem value="低危">低危</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="vulnDescription" className="text-white">漏洞风险描述 (#POCDISCRIBE#)</Label>
                  <Textarea
                    id="vulnDescription"
                    value={currentVulnerability.description}
                    onChange={(e) => setCurrentVulnerability(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="详细描述漏洞的风险和可能造成的影响..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vulnProcess" className="text-white">漏洞发现过程 (#POCPROCESS#)</Label>
                  <Textarea
                    id="vulnProcess"
                    value={currentVulnerability.process}
                    onChange={(e) => setCurrentVulnerability(prev => ({ ...prev, process: e.target.value }))}
                    placeholder="描述发现该漏洞的具体过程和步骤..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-400 mt-1">注：图片上传功能将在后续版本中支持</p>
                </div>
                <div>
                  <Label htmlFor="vulnAdvice" className="text-white">漏洞整改建议 (#POCADVICE#)</Label>
                  <Textarea
                    id="vulnAdvice"
                    value={currentVulnerability.advice}
                    onChange={(e) => setCurrentVulnerability(prev => ({ ...prev, advice: e.target.value }))}
                    placeholder="提供修复该漏洞的具体建议和解决方案..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={addVulnerability} className="w-full bg-blue-600 hover:bg-blue-700">
                  添加漏洞
                </Button>
              </CardContent>
            </Card>

            {reportData.vulnerabilities.length > 0 && (
              <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">已添加的漏洞 ({reportData.vulnerabilities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.vulnerabilities.map((vuln) => (
                      <div key={vuln.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{vuln.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRiskColor(vuln.riskLevel)} text-white`}>
                              {getRiskIcon(vuln.riskLevel)}
                              <span className="ml-1">{vuln.riskLevel}</span>
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeVulnerability(vuln.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{vuln.description}</p>
                        <p className="text-slate-400 text-xs">整改建议: {vuln.advice}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">报告预览</CardTitle>
                <CardDescription className="text-slate-300">
                  预览生成的报告内容，未填写的字段将显示为占位符
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600 space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">渗透测试报告</h2>
                    <Separator className="bg-slate-600 mb-4" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="text-slate-300">
                      <strong className="text-white">系统名称:</strong> {reportData.systemName || '#SYSTEM#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">报告编写日期:</strong> {reportData.reportDate || '#DATA#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">域名或IP:</strong> {reportData.ipOrDomain || '#IP#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">测试日期范围:</strong> {reportData.testDateRange || '#DATARANGE#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">对接人员:</strong> {reportData.contactName || '#DJNAME#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">对接电话:</strong> {reportData.contactPhone || '#DJPHONE#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">测试人员:</strong> {reportData.testerName || '#CSNAME#'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">测试电话:</strong> {reportData.testerPhone || '#CSPHONE#'}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-slate-300">
                      <strong className="text-white">测试账号:</strong> {reportData.testAccount || '#CSACCOUNT#'}
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">发现的漏洞 ({reportData.vulnerabilities.length})</h3>
                    {reportData.vulnerabilities.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.vulnerabilities.map((vuln, index) => (
                          <div key={vuln.id} className="bg-slate-800/30 p-3 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${getRiskColor(vuln.riskLevel)} text-white text-xs`}>
                                {vuln.riskLevel}
                              </Badge>
                              <span className="text-white font-medium">{index + 1}. {vuln.name}</span>
                            </div>
                            <p className="text-slate-300 text-sm mb-1">描述: {vuln.description}</p>
                            <p className="text-slate-400 text-xs">建议: {vuln.advice}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-800/30 p-3 rounded text-slate-400 text-sm">
                        <p>漏洞危害级别: #POCRISK#</p>
                        <p>漏洞名称: #POCNAME#</p>
                        <p>漏洞风险描述: #POCDISCRIBE#</p>
                        <p>漏洞发现过程: #POCPROCESS#</p>
                        <p>漏洞整改建议: #POCADVICE#</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button onClick={generateReport} className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      生成并下载报告
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportGenerator;
