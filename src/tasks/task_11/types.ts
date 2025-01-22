export interface IDoc {
  text: string;
  metadata: {
    date: string;
    reportNum: string;
    sector: string;
    path: string;
  };
}

export interface IKeywords {
  keywords: string;
} 