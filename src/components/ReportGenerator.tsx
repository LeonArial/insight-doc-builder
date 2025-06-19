
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
import { FileText, Download, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  projectName: string;
  clientName: string;
  testDate: string;
  testerName: string;
  executiveSummary: string;
  scope: string;
  methodology: string;
  findings: Array<{
    id: string;
    title: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    impact: string;
    recommendation: string;
  }>;
  conclusion: string;
}

const ReportGenerator = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    projectName: '',
    clientName: '',
    testDate: '',
    testerName: '',
    executiveSummary: '',
    scope: '',
    methodology: '',
    findings: [],
    conclusion: ''
  });

  const [currentFinding, setCurrentFinding] = useState({
    title: '',
    severity: 'Medium' as const,
    description: '',
    impact: '',
    recommendation: ''
  });

  const addFinding = () => {
    if (currentFinding.title && currentFinding.description) {
      const newFinding = {
        ...currentFinding,
        id: Date.now().toString()
      };
      setReportData(prev => ({
        ...prev,
        findings: [...prev.findings, newFinding]
      }));
      setCurrentFinding({
        title: '',
        severity: 'Medium',
        description: '',
        impact: '',
        recommendation: ''
      });
      toast({
        title: "漏洞已添加",
        description: "新的安全漏洞已成功添加到报告中"
      });
    }
  };

  const removeFinding = (id: string) => {
    setReportData(prev => ({
      ...prev,
      findings: prev.findings.filter(f => f.id !== id)
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
      case 'High':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Medium':
        return <Shield className="w-4 h-4" />;
      case 'Low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const generateReport = () => {
    // 生成报告的逻辑
    const reportContent = `
渗透测试报告

项目名称: ${reportData.projectName}
客户名称: ${reportData.clientName}
测试日期: ${reportData.testDate}
测试人员: ${reportData.testerName}

执行摘要:
${reportData.executiveSummary}

测试范围:
${reportData.scope}

测试方法:
${reportData.methodology}

发现的漏洞:
${reportData.findings.map((finding, index) => `
${index + 1}. ${finding.title} (${finding.severity})
   描述: ${finding.description}
   影响: ${finding.impact}
   建议: ${finding.recommendation}
`).join('\n')}

结论:
${reportData.conclusion}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.projectName || '渗透测试报告'}.txt`;
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
          <p className="text-blue-200 text-lg">专业的网络安全评估报告生成工具</p>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur">
            <TabsTrigger value="basic" className="text-white data-[state=active]:bg-blue-600">基本信息</TabsTrigger>
            <TabsTrigger value="content" className="text-white data-[state=active]:bg-blue-600">报告内容</TabsTrigger>
            <TabsTrigger value="findings" className="text-white data-[state=active]:bg-blue-600">漏洞发现</TabsTrigger>
            <TabsTrigger value="preview" className="text-white data-[state=active]:bg-blue-600">预览生成</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  项目基本信息
                </CardTitle>
                <CardDescription className="text-slate-300">
                  填写渗透测试项目的基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectName" className="text-white">项目名称</Label>
                    <Input
                      id="projectName"
                      value={reportData.projectName}
                      onChange={(e) => setReportData(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="输入项目名称"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientName" className="text-white">客户名称</Label>
                    <Input
                      id="clientName"
                      value={reportData.clientName}
                      onChange={(e) => setReportData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="输入客户名称"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testDate" className="text-white">测试日期</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={reportData.testDate}
                      onChange={(e) => setReportData(prev => ({ ...prev, testDate: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testerName" className="text-white">测试人员</Label>
                    <Input
                      id="testerName"
                      value={reportData.testerName}
                      onChange={(e) => setReportData(prev => ({ ...prev, testerName: e.target.value }))}
                      placeholder="输入测试人员姓名"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">报告内容</CardTitle>
                <CardDescription className="text-slate-300">
                  填写报告的主要内容部分
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="executiveSummary" className="text-white">执行摘要</Label>
                  <Textarea
                    id="executiveSummary"
                    value={reportData.executiveSummary}
                    onChange={(e) => setReportData(prev => ({ ...prev, executiveSummary: e.target.value }))}
                    placeholder="简要描述测试的目标、方法和主要发现..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="scope" className="text-white">测试范围</Label>
                  <Textarea
                    id="scope"
                    value={reportData.scope}
                    onChange={(e) => setReportData(prev => ({ ...prev, scope: e.target.value }))}
                    placeholder="详细描述测试的范围和限制..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="methodology" className="text-white">测试方法</Label>
                  <Textarea
                    id="methodology"
                    value={reportData.methodology}
                    onChange={(e) => setReportData(prev => ({ ...prev, methodology: e.target.value }))}
                    placeholder="描述使用的测试方法和工具..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="conclusion" className="text-white">结论</Label>
                  <Textarea
                    id="conclusion"
                    value={reportData.conclusion}
                    onChange={(e) => setReportData(prev => ({ ...prev, conclusion: e.target.value }))}
                    placeholder="总结测试结果和整体安全评估..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="findings" className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">添加安全漏洞</CardTitle>
                <CardDescription className="text-slate-300">
                  记录发现的安全漏洞和风险
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="findingTitle" className="text-white">漏洞标题</Label>
                    <Input
                      id="findingTitle"
                      value={currentFinding.title}
                      onChange={(e) => setCurrentFinding(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="输入漏洞标题"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="severity" className="text-white">严重级别</Label>
                    <Select
                      value={currentFinding.severity}
                      onValueChange={(value) => setCurrentFinding(prev => ({ ...prev, severity: value as any }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">漏洞描述</Label>
                  <Textarea
                    id="description"
                    value={currentFinding.description}
                    onChange={(e) => setCurrentFinding(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="详细描述漏洞的技术细节..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="impact" className="text-white">影响评估</Label>
                  <Textarea
                    id="impact"
                    value={currentFinding.impact}
                    onChange={(e) => setCurrentFinding(prev => ({ ...prev, impact: e.target.value }))}
                    placeholder="描述漏洞可能造成的影响..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="recommendation" className="text-white">修复建议</Label>
                  <Textarea
                    id="recommendation"
                    value={currentFinding.recommendation}
                    onChange={(e) => setCurrentFinding(prev => ({ ...prev, recommendation: e.target.value }))}
                    placeholder="提供修复该漏洞的建议..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button onClick={addFinding} className="w-full bg-blue-600 hover:bg-blue-700">
                  添加漏洞
                </Button>
              </CardContent>
            </Card>

            {reportData.findings.length > 0 && (
              <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">已添加的漏洞</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.findings.map((finding) => (
                      <div key={finding.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{finding.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getSeverityColor(finding.severity)} text-white`}>
                              {getSeverityIcon(finding.severity)}
                              <span className="ml-1">{finding.severity}</span>
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFinding(finding.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{finding.description}</p>
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
                  预览生成的报告内容
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-600 space-y-4">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">渗透测试报告</h2>
                    <Separator className="bg-slate-600 mb-4" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-slate-300">
                      <strong className="text-white">项目名称:</strong> {reportData.projectName || 'XXX'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">客户名称:</strong> {reportData.clientName || 'XXX'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">测试日期:</strong> {reportData.testDate || 'XXX'}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-white">测试人员:</strong> {reportData.testerName || 'XXX'}
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">执行摘要</h3>
                    <p className="text-slate-300 text-sm">{reportData.executiveSummary || 'XXX'}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">发现的漏洞 ({reportData.findings.length})</h3>
                    {reportData.findings.length > 0 ? (
                      <div className="space-y-2">
                        {reportData.findings.map((finding, index) => (
                          <div key={finding.id} className="flex items-center gap-2">
                            <Badge className={`${getSeverityColor(finding.severity)} text-white text-xs`}>
                              {finding.severity}
                            </Badge>
                            <span className="text-slate-300 text-sm">{index + 1}. {finding.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">暂无添加的漏洞</p>
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
