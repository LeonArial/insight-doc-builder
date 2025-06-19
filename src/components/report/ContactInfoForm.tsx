import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ReportData } from './types';

interface ContactInfoFormProps {
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ reportData, setReportData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setReportData(prev => ({ ...prev, [id]: value }));
  };

  return (
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
              <Label htmlFor="contactName" className="text-white">对接人员姓名</Label>
              <Input
                id="contactName"
                value={reportData.contactName}
                onChange={handleChange}
                placeholder="输入对接人员姓名"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone" className="text-white">对接人员联系电话</Label>
              <Input
                id="contactPhone"
                value={reportData.contactPhone}
                onChange={handleChange}
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
              <Label htmlFor="testerName" className="text-white">测试人员姓名</Label>  
              <Input
                id="testerName"
                value={reportData.testerName}
                onChange={handleChange}
                placeholder="输入测试人员姓名"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="testerPhone" className="text-white">测试人员联系电话</Label>
              <Input
                id="testerPhone"
                value={reportData.testerPhone}
                onChange={handleChange}
                placeholder="输入测试人员联系电话"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoForm;
