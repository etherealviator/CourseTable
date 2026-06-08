export interface SchoolEntry {
  name: string;
  urls: string[];
  province?: string;
}

const SCHOOLS_JSON_URL = 'https://raw.githubusercontent.com/etherealviator/CourseTable/v2/src/features/import/schools-data.json';

let cachedSchools: SchoolEntry[] | null = null;

export async function loadSchools(): Promise<SchoolEntry[]> {
  if (cachedSchools) return cachedSchools;
  try {
    const res = await fetch(SCHOOLS_JSON_URL);
    if (res.ok) {
      cachedSchools = await res.json();
      return cachedSchools!;
    }
  } catch {}
  cachedSchools = BUILTIN_SCHOOLS;
  return cachedSchools;
}

export function searchSchools(query: string, schools?: SchoolEntry[]): SchoolEntry[] {
  const list = schools || BUILTIN_SCHOOLS;
  const q = query.trim().toLowerCase();
  if (!q) return list.slice(0, 20);
  return list.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.province || '').toLowerCase().includes(q)
  ).slice(0, 20);
}

const BUILTIN_SCHOOLS: SchoolEntry[] = [
  { name: '北京大学', urls: ['https://elective.pku.edu.cn'], province: '北京' },
  { name: '清华大学', urls: ['http://zhjw.cic.tsinghua.edu.cn'], province: '北京' },
  { name: '复旦大学', urls: ['http://jw.fudan.edu.cn'], province: '上海' },
  { name: '上海交通大学', urls: ['http://electsys.sjtu.edu.cn'], province: '上海' },
  { name: '浙江大学', urls: ['http://jw.zju.edu.cn'], province: '浙江' },
  { name: '南京大学', urls: ['http://jw.nju.edu.cn'], province: '江苏' },
  { name: '武汉大学', urls: ['http://jwc.whu.edu.cn'], province: '湖北' },
  { name: '华中科技大学', urls: ['http://jwc.hust.edu.cn'], province: '湖北' },
  { name: '中山大学', urls: ['http://jwc.sysu.edu.cn'], province: '广东' },
  { name: '四川大学', urls: ['http://jwc.scu.edu.cn'], province: '四川' },
  { name: '西安交通大学', urls: ['http://jwc.xjtu.edu.cn'], province: '陕西' },
  { name: '哈尔滨工业大学', urls: ['http://jw.hit.edu.cn'], province: '黑龙江' },
  { name: '中国科学技术大学', urls: ['http://jw.ustc.edu.cn'], province: '安徽' },
  { name: '厦门大学', urls: ['http://jwc.xmu.edu.cn'], province: '福建' },
  { name: '电子科技大学', urls: ['http://jwc.uestc.edu.cn'], province: '四川' },
];
