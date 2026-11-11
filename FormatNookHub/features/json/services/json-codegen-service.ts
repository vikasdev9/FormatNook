import { CodeGenLanguage, CodeGenOptions } from '../types/json.types';

export interface InferredField {
  name: string;
  type: InferredType;
  nullable: boolean;
  optional: boolean;
}

export type InferredType =
  | { kind: 'string' }
  | { kind: 'number'; isInteger: boolean }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'any' }
  | { kind: 'array'; elementType: InferredType }
  | { kind: 'object'; className: string; fields: InferredField[] };

/**
 * Capitalizes string and converts to valid PascalCase identifier
 */
export function toPascalCase(str: string): string {
  if (!str) return 'Root';
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') || 'Model';
}

/**
 * Converts string to valid camelCase identifier
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Converts string to valid snake_case identifier
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'field';
}

/**
 * Analyzes a JSON value and extracts nested class/type structure.
 */
export function inferSchema(
  value: any,
  name: string = 'Root',
  collectedClasses: Map<string, InferredField[]> = new Map(),
  options: { optionalFields?: boolean } = {}
): InferredType {
  if (value === null) {
    return { kind: 'null' };
  }

  if (typeof value === 'string') {
    return { kind: 'string' };
  }

  if (typeof value === 'number') {
    return { kind: 'number', isInteger: Number.isInteger(value) };
  }

  if (typeof value === 'boolean') {
    return { kind: 'boolean' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { kind: 'array', elementType: { kind: 'any' } };
    }
    // Inspect elements to infer common type
    const elemType = inferSchema(value[0], `${name}Item`, collectedClasses, options);
    return { kind: 'array', elementType: elemType };
  }

  if (typeof value === 'object') {
    const className = toPascalCase(name);
    const fields: InferredField[] = [];

    for (const [key, val] of Object.entries(value)) {
      const fieldType = inferSchema(val, key, collectedClasses, options);
      fields.push({
        name: key,
        type: fieldType,
        nullable: val === null,
        optional: options.optionalFields || false,
      });
    }

    collectedClasses.set(className, fields);
    return { kind: 'object', className, fields };
  }

  return { kind: 'any' };
}

/**
 * Collects all nested object schemas recursively from an InferredType.
 */
function collectAllObjects(
  rootType: InferredType,
  classes: Map<string, InferredField[]> = new Map()
): Map<string, InferredField[]> {
  if (rootType.kind === 'object') {
    classes.set(rootType.className, rootType.fields);
    for (const field of rootType.fields) {
      collectAllObjects(field.type, classes);
    }
  } else if (rootType.kind === 'array') {
    collectAllObjects(rootType.elementType, classes);
  }
  return classes;
}

/**
 * TypeScript generator
 */
function generateTypeScript(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const keyword = options.useInterfaces ? 'interface' : 'type';
  const lines: string[] = ['// Generated with FormatNook Hub (TypeScript)', ''];

  function typeToTs(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'any';
    if (t.kind === 'string') base = 'string';
    else if (t.kind === 'number') base = 'number';
    else if (t.kind === 'boolean') base = 'boolean';
    else if (t.kind === 'null') base = 'null';
    else if (t.kind === 'array') base = `${typeToTs(t.elementType, false, false)}[]`;
    else if (t.kind === 'object') base = t.className;

    if (nullable && base !== 'null' && base !== 'any') {
      base += ' | null';
    }
    return base;
  }

  if (rootType.kind !== 'object' && rootType.kind !== 'array') {
    return `export type ${rootName} = ${typeToTs(rootType, false, false)};\n`;
  }

  for (const [clsName, fields] of classes.entries()) {
    if (options.useInterfaces) {
      lines.push(`export interface ${clsName} {`);
      for (const f of fields) {
        const opt = f.optional ? '?' : '';
        lines.push(`  ${f.name}${opt}: ${typeToTs(f.type, f.nullable, f.optional)};`);
      }
      lines.push('}', '');
    } else {
      lines.push(`export type ${clsName} = {`);
      for (const f of fields) {
        const opt = f.optional ? '?' : '';
        lines.push(`  ${f.name}${opt}: ${typeToTs(f.type, f.nullable, f.optional)};`);
      }
      lines.push('};', '');
    }
  }

  return lines.join('\n');
}

/**
 * JavaScript JSDoc generator
 */
function generateJavaScript(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = ['// Generated with FormatNook Hub (JavaScript with JSDoc)', ''];

  function typeToJsDoc(t: InferredType, nullable: boolean): string {
    let base = '*';
    if (t.kind === 'string') base = 'string';
    else if (t.kind === 'number') base = 'number';
    else if (t.kind === 'boolean') base = 'boolean';
    else if (t.kind === 'null') base = 'null';
    else if (t.kind === 'array') base = `${typeToJsDoc(t.elementType, false)}[]`;
    else if (t.kind === 'object') base = t.className;

    if (nullable && base !== 'null') base += '|null';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push('/**', ` * @typedef {Object} ${clsName}`);
    for (const f of fields) {
      const opt = f.optional ? `[${f.name}]` : f.name;
      lines.push(` * @property {${typeToJsDoc(f.type, f.nullable)}} ${opt}`);
    }
    lines.push(' */', '');
  }

  return lines.join('\n');
}

/**
 * Python Dataclasses generator
 */
function generatePython(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '# Generated with FormatNook Hub (Python 3.10+ Dataclasses)',
    'from __future__ import annotations',
    'from dataclasses import dataclass',
    'from typing import Optional, List, Any',
    '',
  ];

  function typeToPy(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'Any';
    if (t.kind === 'string') base = 'str';
    else if (t.kind === 'number') base = t.isInteger ? 'int' : 'float';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'Any';
    else if (t.kind === 'array') base = `List[${typeToPy(t.elementType, false, false)}]`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) {
      return `Optional[${base}] = None`;
    }
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push('@dataclass', `class ${clsName}:`);
    if (fields.length === 0) {
      lines.push('    pass', '');
      continue;
    }
    for (const f of fields) {
      const pyName = toSnakeCase(f.name);
      lines.push(`    ${pyName}: ${typeToPy(f.type, f.nullable, f.optional)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Java POJO generator
 */
function generateJava(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '// Generated with FormatNook Hub (Java)',
    'import java.util.List;',
    'import com.fasterxml.jackson.annotation.JsonProperty;',
    '',
  ];

  function typeToJava(t: InferredType): string {
    if (t.kind === 'string') return 'String';
    if (t.kind === 'number') return t.isInteger ? 'Integer' : 'Double';
    if (t.kind === 'boolean') return 'Boolean';
    if (t.kind === 'null') return 'Object';
    if (t.kind === 'array') return `List<${typeToJava(t.elementType)}>`;
    if (t.kind === 'object') return t.className;
    return 'Object';
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`public class ${clsName} {`);
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`    @JsonProperty("${f.name}")`);
      lines.push(`    private ${typeToJava(f.type)} ${varName};`);
    }
    lines.push('');
    // Getters and Setters
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      const pascal = toPascalCase(f.name);
      const t = typeToJava(f.type);
      lines.push(`    public ${t} get${pascal}() { return this.${varName}; }`);
      lines.push(`    public void set${pascal}(${t} ${varName}) { this.${varName} = ${varName}; }`);
    }
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Kotlin Data Class generator
 */
function generateKotlin(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '// Generated with FormatNook Hub (Kotlin)',
    'import com.google.gson.annotations.SerializedName',
    '',
  ];

  function typeToKotlin(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'Any';
    if (t.kind === 'string') base = 'String';
    else if (t.kind === 'number') base = t.isInteger ? 'Long' : 'Double';
    else if (t.kind === 'boolean') base = 'Boolean';
    else if (t.kind === 'null') base = 'Any?';
    else if (t.kind === 'array') base = `List<${typeToKotlin(t.elementType, false, false)}>`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) base += '?';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`data class ${clsName}(`);
    fields.forEach((f, idx) => {
      const comma = idx < fields.length - 1 ? ',' : '';
      const varName = toCamelCase(f.name);
      lines.push(`    @SerializedName("${f.name}") val ${varName}: ${typeToKotlin(f.type, f.nullable, f.optional)}${comma}`);
    });
    lines.push(')', '');
  }

  return lines.join('\n');
}

/**
 * C# Record/Class generator
 */
function generateCSharp(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '// Generated with FormatNook Hub (C# 10+ / .NET 6+)',
    'using System.Text.Json.Serialization;',
    'using System.Collections.Generic;',
    '',
  ];

  function typeToCs(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'object';
    if (t.kind === 'string') base = 'string';
    else if (t.kind === 'number') base = t.isInteger ? 'long' : 'double';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'object';
    else if (t.kind === 'array') base = `List<${typeToCs(t.elementType, false, false)}>`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) base += '?';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`public class ${clsName}`);
    lines.push('{');
    for (const f of fields) {
      const propName = toPascalCase(f.name);
      lines.push(`    [JsonPropertyName("${f.name}")]`);
      lines.push(`    public ${typeToCs(f.type, f.nullable, f.optional)} ${propName} { get; set; }`);
      lines.push('');
    }
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Go Structs generator
 */
function generateGo(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = ['// Generated with FormatNook Hub (Go)', 'package main', ''];

  function typeToGo(t: InferredType, nullable: boolean): string {
    let base = 'interface{}';
    if (t.kind === 'string') base = 'string';
    else if (t.kind === 'number') base = t.isInteger ? 'int64' : 'float64';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'interface{}';
    else if (t.kind === 'array') base = `[]${typeToGo(t.elementType, false)}`;
    else if (t.kind === 'object') base = t.className;

    if (nullable && base !== 'interface{}') base = `*${base}`;
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`type ${clsName} struct {`);
    for (const f of fields) {
      const fieldName = toPascalCase(f.name);
      const opt = f.optional ? ',omitempty' : '';
      lines.push(`\t${fieldName} ${typeToGo(f.type, f.nullable)} \`json:"${f.name}${opt}"\``);
    }
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Rust Structs generator
 */
function generateRust(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '// Generated with FormatNook Hub (Rust with serde)',
    'use serde::{Serialize, Deserialize};',
    '',
  ];

  function typeToRust(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'serde_json::Value';
    if (t.kind === 'string') base = 'String';
    else if (t.kind === 'number') base = t.isInteger ? 'i64' : 'f64';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'Option<serde_json::Value>';
    else if (t.kind === 'array') base = `Vec<${typeToRust(t.elementType, false, false)}>`;
    else if (t.kind === 'object') base = t.className;

    if ((nullable || optional) && !base.startsWith('Option<')) {
      base = `Option<${base}>`;
    }
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push('#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]');
    lines.push(`pub struct ${clsName} {`);
    for (const f of fields) {
      const rustField = toSnakeCase(f.name);
      lines.push(`    #[serde(rename = "${f.name}")]`);
      lines.push(`    pub ${rustField}: ${typeToRust(f.type, f.nullable, f.optional)},`);
    }
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Swift Structs generator
 */
function generateSwift(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = ['// Generated with FormatNook Hub (Swift Codable)', 'import Foundation', ''];

  function typeToSwift(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'AnyCodable';
    if (t.kind === 'string') base = 'String';
    else if (t.kind === 'number') base = t.isInteger ? 'Int' : 'Double';
    else if (t.kind === 'boolean') base = 'Bool';
    else if (t.kind === 'null') base = 'AnyCodable?';
    else if (t.kind === 'array') base = `[${typeToSwift(t.elementType, false, false)}]`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) base += '?';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`public struct ${clsName}: Codable {`);
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`    public let ${varName}: ${typeToSwift(f.type, f.nullable, f.optional)}`);
    }
    lines.push('');
    lines.push('    enum CodingKeys: String, CodingKey {');
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`        case ${varName} = "${f.name}"`);
    }
    lines.push('    }');
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Dart Class generator
 */
function generateDart(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = ['// Generated with FormatNook Hub (Dart)', ''];

  function typeToDart(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'dynamic';
    if (t.kind === 'string') base = 'String';
    else if (t.kind === 'number') base = t.isInteger ? 'int' : 'double';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'dynamic';
    else if (t.kind === 'array') base = `List<${typeToDart(t.elementType, false, false)}>`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) base += '?';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`class ${clsName} {`);
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`  final ${typeToDart(f.type, f.nullable, f.optional)} ${varName};`);
    }
    lines.push('');
    // Constructor
    lines.push(`  ${clsName}({`);
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      const req = f.optional || f.nullable ? '' : 'required ';
      lines.push(`    ${req}this.${varName},`);
    }
    lines.push('  });', '');

    // fromJson
    lines.push(`  factory ${clsName}.fromJson(Map<String, dynamic> json) => ${clsName}(`);
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`    ${varName}: json['${f.name}'],`);
    }
    lines.push('  );', '');

    // toJson
    lines.push('  Map<String, dynamic> toJson() => {');
    for (const f of fields) {
      const varName = toCamelCase(f.name);
      lines.push(`    '${f.name}': ${varName},`);
    }
    lines.push('  };');
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * PHP 8.1+ DTO generator
 */
function generatePhp(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = ['<?php', '// Generated with FormatNook Hub (PHP 8.1+)', ''];

  function typeToPhp(t: InferredType, nullable: boolean): string {
    let base = 'mixed';
    if (t.kind === 'string') base = 'string';
    else if (t.kind === 'number') base = t.isInteger ? 'int' : 'float';
    else if (t.kind === 'boolean') base = 'bool';
    else if (t.kind === 'null') base = 'mixed';
    else if (t.kind === 'array') base = 'array';
    else if (t.kind === 'object') base = t.className;

    if (nullable && base !== 'mixed') base = `?${base}`;
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`readonly class ${clsName}`);
    lines.push('{');
    lines.push('    public function __construct(');
    fields.forEach((f, idx) => {
      const comma = idx < fields.length - 1 ? ',' : '';
      const varName = toCamelCase(f.name);
      lines.push(`        public ${typeToPhp(f.type, f.nullable)} $${varName}${comma}`);
    });
    lines.push('    ) {}');
    lines.push('}', '');
  }

  return lines.join('\n');
}

/**
 * Ruby Dry-Struct generator
 */
function generateRuby(rootName: string, rootType: InferredType, options: CodeGenOptions): string {
  const classes = collectAllObjects(rootType);
  const lines: string[] = [
    '# Generated with FormatNook Hub (Ruby Dry::Struct)',
    'require "dry-struct"',
    'require "dry-types"',
    '',
    'module Types',
    '  include Dry.Types()',
    'end',
    '',
  ];

  function typeToRuby(t: InferredType, nullable: boolean, optional: boolean): string {
    let base = 'Types::Any';
    if (t.kind === 'string') base = 'Types::String';
    else if (t.kind === 'number') base = t.isInteger ? 'Types::Integer' : 'Types::Float';
    else if (t.kind === 'boolean') base = 'Types::Bool';
    else if (t.kind === 'null') base = 'Types::Nil';
    else if (t.kind === 'array') base = `Types::Array.of(${typeToRuby(t.elementType, false, false)})`;
    else if (t.kind === 'object') base = t.className;

    if (nullable || optional) base += '.optional';
    return base;
  }

  for (const [clsName, fields] of classes.entries()) {
    lines.push(`class ${clsName} < Dry::Struct`);
    for (const f of fields) {
      const rubyName = toSnakeCase(f.name);
      lines.push(`  attribute :${rubyName}, ${typeToRuby(f.type, f.nullable, f.optional)}`);
    }
    lines.push('end', '');
  }

  return lines.join('\n');
}

/**
 * Main code generation dispatcher
 */
export function generateCodeFromData(data: any, options: CodeGenOptions): string {
  const rootName = toPascalCase(options.rootClassName || 'Root');
  const rootType = inferSchema(data, rootName, new Map(), { optionalFields: options.optionalFields });

  switch (options.language) {
    case 'typescript':
      return generateTypeScript(rootName, rootType, options);
    case 'javascript':
      return generateJavaScript(rootName, rootType, options);
    case 'python':
      return generatePython(rootName, rootType, options);
    case 'java':
      return generateJava(rootName, rootType, options);
    case 'kotlin':
      return generateKotlin(rootName, rootType, options);
    case 'csharp':
      return generateCSharp(rootName, rootType, options);
    case 'go':
      return generateGo(rootName, rootType, options);
    case 'rust':
      return generateRust(rootName, rootType, options);
    case 'swift':
      return generateSwift(rootName, rootType, options);
    case 'dart':
      return generateDart(rootName, rootType, options);
    case 'php':
      return generatePhp(rootName, rootType, options);
    case 'ruby':
      return generateRuby(rootName, rootType, options);
    default:
      return generateTypeScript(rootName, rootType, options);
  }
}
