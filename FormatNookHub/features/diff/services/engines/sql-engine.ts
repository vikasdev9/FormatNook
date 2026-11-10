import { DiffEngine, DiffEngineInput, DiffEngineResult } from './types';
import { computeRawTextDiff } from '../diff-service';
import { formatSql } from '@/features/beautifiers/services/beautifier-service';

export interface SqlClauseDiff {
  statementIndex: number;
  clause: string;
  kind: 'added' | 'removed' | 'modified';
  oldValue?: string;
  newValue?: string;
}

export class SqlEngine implements DiffEngine {
  readonly format = 'sql';

  compare(input: DiffEngineInput): DiffEngineResult {
    const { originalText, modifiedText, options } = input;

    const isEmptyOriginal = !originalText || !originalText.trim();
    const isEmptyModified = !modifiedText || !modifiedText.trim();

    if (isEmptyOriginal && isEmptyModified) {
      return {
        lines: [],
        statistics: {
          totalLines: 0,
          addedLines: 0,
          removedLines: 0,
          modifiedLines: 0,
          unchangedLines: 0,
          differencePercentage: 0,
        },
        isIdentical: true,
        isEmpty: true,
        unifiedDiffText: '',
        format: 'sql',
        detectedFormat: 'sql',
        isValid: { original: true, modified: true },
        errors: {},
      };
    }

    let origValid = true;
    let modValid = true;
    let origError: string | undefined;
    let modError: string | undefined;
    let normOrig = originalText;
    let normMod = modifiedText;

    if (!isEmptyOriginal) {
      const f = formatSql(originalText);
      if (!f.isValid && f.issues.length > 0 && f.issues[0].severity === 'error') {
        origValid = false;
        origError = f.issues[0].message;
      } else {
        normOrig = f.output;
      }
    }

    if (!isEmptyModified) {
      const f = formatSql(modifiedText);
      if (!f.isValid && f.issues.length > 0 && f.issues[0].severity === 'error') {
        modValid = false;
        modError = f.issues[0].message;
      } else {
        normMod = f.output;
      }
    }

    if (!origValid || !modValid) {
      const fallbackResult = computeRawTextDiff(originalText, modifiedText, {
        ...options,
        format: 'text',
      });

      return {
        ...fallbackResult,
        format: 'sql',
        detectedFormat: 'sql',
        isValid: { original: origValid, modified: modValid },
        errors: { original: origError, modified: modError },
        formatWarnings: { original: origError, modified: modError },
      };
    }

    // Structured comparison of clauses and statements
    const clauseDiffs = this.diffSqlStatements(normOrig, normMod);

    const diffResult = computeRawTextDiff(normOrig, normMod, {
      ...options,
      format: 'text',
    });

    return {
      ...diffResult,
      format: 'sql',
      detectedFormat: 'sql',
      isValid: { original: true, modified: true },
      errors: {},
      structuredData: {
        type: 'sql',
        summary: `${clauseDiffs.length} SQL clause/statement differences detected.`,
        details: {
          clauseChanges: clauseDiffs,
        },
      },
    };
  }

  /**
   * Compare SQL statements and their key clauses.
   */
  diffSqlStatements(sqlA: string, sqlB: string): SqlClauseDiff[] {
    const stmtsA = this.splitStatements(sqlA);
    const stmtsB = this.splitStatements(sqlB);
    const diffs: SqlClauseDiff[] = [];

    const max = Math.max(stmtsA.length, stmtsB.length);
    for (let i = 0; i < max; i++) {
      const sA = stmtsA[i];
      const sB = stmtsB[i];

      if (!sB) {
        diffs.push({
          statementIndex: i + 1,
          clause: 'STATEMENT',
          kind: 'removed',
          oldValue: sA.trim().slice(0, 50) + '...',
        });
        continue;
      }

      if (!sA) {
        diffs.push({
          statementIndex: i + 1,
          clause: 'STATEMENT',
          kind: 'added',
          newValue: sB.trim().slice(0, 50) + '...',
        });
        continue;
      }

      // Both statements exist: Compare clauses
      const clausesA = this.extractClauses(sA);
      const clausesB = this.extractClauses(sB);

      const allClauses = Array.from(new Set([...Object.keys(clausesA), ...Object.keys(clausesB)]));

      for (const clause of allClauses) {
        const valA = clausesA[clause];
        const valB = clausesB[clause];

        if (valA && !valB) {
          diffs.push({ statementIndex: i + 1, clause, kind: 'removed', oldValue: valA });
        } else if (!valA && valB) {
          diffs.push({ statementIndex: i + 1, clause, kind: 'added', newValue: valB });
        } else if (valA && valB && this.cleanClause(valA) !== this.cleanClause(valB)) {
          diffs.push({ statementIndex: i + 1, clause, kind: 'modified', oldValue: valA, newValue: valB });
        }
      }
    }

    return diffs;
  }

  private splitStatements(sql: string): string[] {
    return sql
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private extractClauses(stmt: string): Record<string, string> {
    const clauseKeywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'LIMIT',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'JOIN',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE FROM',
    ];

    const clauses: Record<string, string> = {};
    const pattern = new RegExp(`\\b(${clauseKeywords.join('|')})\\b`, 'gi');

    const matches: { keyword: string; index: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(stmt)) !== null) {
      matches.push({ keyword: m[1].toUpperCase(), index: m.index });
    }

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const next = matches[i + 1];
      const start = cur.index + cur.keyword.length;
      const end = next ? next.index : stmt.length;
      const content = stmt.slice(start, end).trim();
      clauses[cur.keyword] = content;
    }

    return clauses;
  }

  private cleanClause(clauseText: string): string {
    return clauseText.replace(/\s+/g, ' ').trim();
  }
}

export const sqlEngine = new SqlEngine();

