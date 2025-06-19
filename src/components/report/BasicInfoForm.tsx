import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { ReportData } from './types';

interface BasicInfoFormProps {
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ reportData, setReportData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setReportData(prev => ({ ...prev, [id]: value }));
  };

  return (
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="ipOrDomain" className="text-white">域名或IP地址 (#IP#)</Label>
            <Input
              id="ipOrDomain"
              value={reportData.ipOrDomain}
              onChange={handleChange}
              placeholder="输入域名或IP地址"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="testDateRange" className="text-white">测试日期范围 (#DATARANGE#)</Label>
            <Input
              id="testDateRange"
              value={reportData.testDateRange}
              onChange={handleChange}
              placeholder="例如：2025/06/17-2025/06/19"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="testAccount" className="text-white">测试账号或认证设施 (#CSACCOUNT#)</Label>
            <Input
              id="testAccount"
              value={reportData.testAccount}
              onChange={handleChange}
              placeholder="输入测试账号或使用的认证设施"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
