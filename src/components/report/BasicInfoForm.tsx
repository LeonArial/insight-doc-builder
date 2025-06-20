import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDateRangeSelect = (selectedRange: DateRange | undefined) => {
    setDateRange(selectedRange);
    let formattedRange = '';
    if (selectedRange?.from) {
      if (selectedRange.to) {
        formattedRange = `${format(selectedRange.from, 'yyyy-MM-dd')} 至 ${format(selectedRange.to, 'yyyy-MM-dd')}`;
      } else {
        formattedRange = format(selectedRange.from, 'yyyy-MM-dd');
      }
    }
    setReportData(prev => ({ ...prev, testDateRange: formattedRange }));
  };

    const [date, setDate] = useState<Date | undefined>(
    reportData.reportDate ? new Date(reportData.reportDate) : new Date()
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formatted = format(selectedDate, 'yyyy-MM-dd');
      const sDate = format(selectedDate, 'yyyy-MMdd');
      setReportData(prev => ({
        ...prev,
        reportDate: formatted,
        sDate: sDate
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setReportData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
      <CardContent className="space-y-4 mt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="systemName" className="text-white">系统名称</Label>
            <Input
              id="systemName"
              value={reportData.systemName}
              onChange={handleChange}
              placeholder="输入系统名称"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="reportDate" className="text-white">报告编写日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportData.reportDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="ipOrDomain" className="text-white">域名或IP地址</Label>
            <Input
              id="ipOrDomain"
              value={reportData.ipOrDomain}
              onChange={handleChange}
              placeholder="输入域名或IP地址"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="testDateRange" className="text-white">测试日期范围</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="testDateRange"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white",
                    !reportData.testDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reportData.testDateRange ? (
                    reportData.testDateRange
                  ) : (
                    <span>选择一个日期范围</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="testAccount" className="text-white">测试账号或认证设施</Label>
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
