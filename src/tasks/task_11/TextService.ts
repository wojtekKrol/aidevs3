import type { IDoc } from "./types";

export class TextService {
  constructor() {}

  async processReport(reportPath: string): Promise<IDoc> {
    const text = await Bun.file(reportPath).text();
    
    // Extract metadata from filename
    const filename = reportPath.split('/').pop() || '';
    const [date, reportInfo] = filename.split('_');
    const [reportNum, sector] = reportInfo.split('-').slice(1);
    
    const metadata = {
      date: date,
      reportNum: reportNum,
      sector: sector.replace('.txt', ''),
      path: reportPath
    };

    return {
      text,
      metadata
    };
  }

  async processReports(reportPaths: string[]): Promise<IDoc[]> {
    return Promise.all(reportPaths.map(path => this.processReport(path)));
  }

  findRelatedReports(docs: IDoc[], currentDoc: IDoc): IDoc[] {
    return docs.filter(doc => {
      if (doc.metadata.path === currentDoc.metadata.path) return false;
      
      // Same sector
      if (doc.metadata.sector === currentDoc.metadata.sector) return true;
      
      // Same date
      if (doc.metadata.date === currentDoc.metadata.date) return true;
      
      // Check for mentions of same people/objects in text
      const words: string[] = currentDoc.text.toLowerCase().split(/\s+/);
      return words.some((word: string) => 
        doc.text.toLowerCase().includes(word) && 
        word.length > 4 // Ignore short words
      );
    });
  }
} 