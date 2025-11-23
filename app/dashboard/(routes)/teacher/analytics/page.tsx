"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useTheme } from 'next-themes';
import { useTranslations } from '@/lib/use-translations';
import { useRTL } from '@/components/providers/rtl-provider';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define types for analytics data
interface CourseAnalytic {
  id: string;
  title: string;
  sales: number;
  revenue: number;
  completionRate: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface AnalyticsData {
  totalRevenue: number;
  totalSales: number;
  courseCount: number;
  courseAnalytics: CourseAnalytic[];
  revenueData: ChartData;
  salesData: ChartData;
}

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const { isRTL } = useRTL();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalSales: 0,
    courseCount: 0,
    courseAnalytics: [],
    revenueData: {
      labels: [],
      datasets: [
        {
          label: t("revenue") || 'الإيرادات',
          data: [],
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    },
    salesData: {
      labels: [],
      datasets: [
        {
          label: t("sales") || 'Sales',
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        console.log('[ANALYTICS_PAGE] Fetching analytics...');
        const response = await axios.get('/api/teacher/analytics');
        console.log('[ANALYTICS_PAGE] Analytics data received:', response.data);
        setAnalytics(response.data);
      } catch (error) {
        console.error('[ANALYTICS_PAGE] Error fetching analytics:', error);
        if (axios.isAxiosError(error)) {
          console.error('[ANALYTICS_PAGE] Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Get text color based on theme
  const textColor = theme === 'dark' ? 'white' : '#334155'; // slate-700 for light mode

  // Get grid color based on theme
  const gridColor = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(100, 116, 139, 0.2)'; // slate-400 with opacity for light mode

  // Update chart options to be theme-compatible
  const barOptions = {
    responsive: true,
    color: textColor,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: t("revenueByCourse"),
        color: textColor,
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      },
      y: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    color: textColor,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: t("salesDistribution"),
        color: textColor,
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const
        }
      },
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("analytics")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("yourAnalytics")}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-blue-50 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">{t("totalRevenue")}</h3>
          <p className="text-3xl font-bold" dir="ltr">{t("egp")} {analytics.totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-6 bg-green-50 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">{t("totalSales")}</h3>
          <p className="text-3xl font-bold">{analytics.totalSales}</p>
        </Card>
        <Card className="p-6 bg-amber-50 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">{t("publishedCourses")}</h3>
          <p className="text-3xl font-bold">{analytics.courseCount}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg shadow-sm">
          <h3 className={`text-lg font-medium mb-4 ${isRTL ? "text-right" : "text-left"}`}>{t("revenueByCourse")}</h3>
          <div className="h-80">
            <Bar options={barOptions} data={analytics.revenueData} />
          </div>
        </Card>
        <Card className="p-6 rounded-lg shadow-sm">
          <h3 className={`text-lg font-medium mb-4 ${isRTL ? "text-right" : "text-left"}`}>{t("salesDistribution")}</h3>
          <div className="h-80 flex items-center justify-center">
            <Pie options={pieOptions} data={analytics.salesData} />
          </div>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card className="p-6 rounded-lg shadow-sm">
        <h3 className={`text-lg font-medium mb-4 ${isRTL ? "text-right" : "text-left"}`}>{t("coursePerformance")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className={`${isRTL ? "text-right" : "text-left"} py-3 px-2`}>{t("course")}</th>
                <th className="text-center py-3 px-2">{t("sales")}</th>
                <th className="text-center py-3 px-2" dir="ltr">{t("revenue")}</th>
                <th className="text-center py-3 px-2">{t("completionRate")}</th>
              </tr>
            </thead>
            <tbody>
              {analytics.courseAnalytics.map((course) => (
                <tr key={course.id} className="border-b hover:bg-slate-50 transition">
                  <td className={`py-3 px-2 ${isRTL ? "text-right" : "text-left"}`} style={{ direction: isRTL ? "rtl" : "ltr" }}>{course.title}</td>
                  <td className="text-center py-3 px-2">{course.sales}</td>
                  <td className="text-center py-3 px-2" dir="ltr">{t("egp")} {course.revenue.toFixed(2)}</td>
                  <td className="text-center py-3 px-2">
                    <div className={`flex items-center ${isRTL ? "justify-end" : "justify-start"}`}>
                      <div className={`w-full bg-slate-200 rounded-full h-2.5 ${isRTL ? "mr-2" : "ml-2"} max-w-[150px]`}>
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                      <span dir="ltr">{course.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage; 