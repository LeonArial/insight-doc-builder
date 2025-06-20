import React from 'react';
import { Shield } from 'lucide-react';

const ReportHeader = () => (
  <div className="text-center mb-8">
    <div className="flex items-center justify-center mb-4">
      <Shield className="w-12 h-12 text-blue-400 mr-3" />
      <h1 className="text-4xl font-bold text-white">报告生成器</h1>
    </div>
    <p className="text-blue-200 text-lg ml-3">基于CSCEC8B-PT渗透测试报告模板</p>
  </div>
);

export default ReportHeader;
