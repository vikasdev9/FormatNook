import { describe, it, expect } from 'vitest';
import {
  generateCodeFromData,
  inferSchema,
  toPascalCase,
  toSnakeCase,
  toCamelCase,
} from '../services/json-codegen-service';

describe('JSON CodeGen Service', () => {
  const sampleData = {
    userId: 101,
    username: 'alex_mercer',
    email: 'alex@example.com',
    isVerified: true,
    avatarUrl: null,
    tags: ['typescript', 'fullstack'],
    profile: {
      bio: 'Software engineer',
      reputation: 98.5,
    },
  };

  it('generates TypeScript types and interfaces', () => {
    const tsInterfaces = generateCodeFromData(sampleData, {
      language: 'typescript',
      rootClassName: 'UserAccount',
      useInterfaces: true,
    });
    expect(tsInterfaces).toContain('export interface UserAccount');
    expect(tsInterfaces).toContain('export interface Profile');
    expect(tsInterfaces).toContain('userId: number;');
    expect(tsInterfaces).toContain('tags: string[];');

    const tsTypes = generateCodeFromData(sampleData, {
      language: 'typescript',
      rootClassName: 'UserAccount',
      useInterfaces: false,
      optionalFields: true,
    });
    expect(tsTypes).toContain('export type UserAccount = {');
    expect(tsTypes).toContain('userId?: number;');
  });

  it('generates Python dataclasses', () => {
    const py = generateCodeFromData(sampleData, {
      language: 'python',
      rootClassName: 'UserAccount',
    });
    expect(py).toContain('@dataclass');
    expect(py).toContain('class UserAccount:');
    expect(py).toContain('class Profile:');
    expect(py).toContain('user_id: int');
    expect(py).toContain('tags: List[str]');
  });

  it('generates Java POJOs with Jackson annotations', () => {
    const java = generateCodeFromData(sampleData, {
      language: 'java',
      rootClassName: 'UserAccount',
    });
    expect(java).toContain('public class UserAccount {');
    expect(java).toContain('public class Profile {');
    expect(java).toContain('@JsonProperty("userId")');
    expect(java).toContain('private Integer userId;');
    expect(java).toContain('public Integer getUserId()');
  });

  it('generates Kotlin data classes with Gson annotations', () => {
    const kotlin = generateCodeFromData(sampleData, {
      language: 'kotlin',
      rootClassName: 'UserAccount',
    });
    expect(kotlin).toContain('data class UserAccount(');
    expect(kotlin).toContain('@SerializedName("userId") val userId: Long');
    expect(kotlin).toContain('data class Profile(');
  });

  it('generates C# classes with System.Text.Json', () => {
    const csharp = generateCodeFromData(sampleData, {
      language: 'csharp',
      rootClassName: 'UserAccount',
    });
    expect(csharp).toContain('public class UserAccount');
    expect(csharp).toContain('[JsonPropertyName("userId")]');
    expect(csharp).toContain('public long UserId { get; set; }');
  });

  it('generates Go structs with json tags', () => {
    const go = generateCodeFromData(sampleData, {
      language: 'go',
      rootClassName: 'UserAccount',
    });
    expect(go).toContain('type UserAccount struct {');
    expect(go).toContain('UserId int64 `json:"userId"`');
    expect(go).toContain('type Profile struct {');
  });

  it('generates Rust structs with Serde annotations', () => {
    const rust = generateCodeFromData(sampleData, {
      language: 'rust',
      rootClassName: 'UserAccount',
    });
    expect(rust).toContain('#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]');
    expect(rust).toContain('pub struct UserAccount {');
    expect(rust).toContain('#[serde(rename = "userId")]');
    expect(rust).toContain('pub user_id: i64,');
  });

  it('generates Swift Codable structs', () => {
    const swift = generateCodeFromData(sampleData, {
      language: 'swift',
      rootClassName: 'UserAccount',
    });
    expect(swift).toContain('public struct UserAccount: Codable {');
    expect(swift).toContain('enum CodingKeys: String, CodingKey');
    expect(swift).toContain('case userId = "userId"');
  });

  it('generates Dart, PHP, Ruby, and JavaScript JSDoc', () => {
    const dart = generateCodeFromData(sampleData, { language: 'dart', rootClassName: 'UserAccount' });
    expect(dart).toContain('class UserAccount {');
    expect(dart).toContain('factory UserAccount.fromJson');

    const php = generateCodeFromData(sampleData, { language: 'php', rootClassName: 'UserAccount' });
    expect(php).toContain('readonly class UserAccount');
    expect(php).toContain('public mixed $avatarUrl');

    const ruby = generateCodeFromData(sampleData, { language: 'ruby', rootClassName: 'UserAccount' });
    expect(ruby).toContain('class UserAccount < Dry::Struct');

    const js = generateCodeFromData(sampleData, { language: 'javascript', rootClassName: 'UserAccount' });
    expect(js).toContain('@typedef {Object} UserAccount');
  });

  it('identifier casing helpers work as expected', () => {
    expect(toPascalCase('user_profile_data')).toBe('UserProfileData');
    expect(toCamelCase('UserProfileData')).toBe('userProfileData');
    expect(toSnakeCase('userProfileData')).toBe('user_profile_data');
  });

  it('protects against stack overflow by capping maximum recursion depth at 50', () => {
    // Construct deeply nested object with 70 levels of nesting
    let deepObj: any = { value: 'leaf' };
    for (let i = 0; i < 70; i++) {
      deepObj = { nested: deepObj };
    }

    const schema = inferSchema(deepObj, 'DeepRoot');
    expect(schema).toBeDefined();

    const code = generateCodeFromData(deepObj, { language: 'typescript', rootClassName: 'DeepRoot' });
    expect(code).toBeDefined();
    expect(code).toContain('DeepRoot');
    expect(code).toContain('nested: any;');
  });
});
