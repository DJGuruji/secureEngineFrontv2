import { Vulnerability } from '../types/vulnerability';

interface VulnerabilitiesMap {
  [key: string]: any;
}

// Helper functions for generating additional vulnerability details
export const generateDescription = (vuln: any, source: string): string => {
  const checkId = vuln.check_id || '';
  const message = vuln.extra?.message || vuln.message || '';
  
  // Base description from the message
  let description = message;
  
  // Add more context based on vulnerability type
  if (message.toLowerCase().includes('sql injection')) {
    description += ` SQL injection vulnerabilities allow attackers to modify database queries, potentially leading to unauthorized data access, data manipulation, or system compromise. This could affect business operations and expose sensitive customer or company data.`;
  } else if (message.toLowerCase().includes('xss') || checkId.toLowerCase().includes('xss')) {
    description += ` Cross-site scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by users. This could lead to session hijacking, credential theft, or malicious actions performed on behalf of the user.`;
  } else if (message.toLowerCase().includes('command injection') || checkId.toLowerCase().includes('command-injection')) {
    description += ` Command injection vulnerabilities can allow attackers to execute arbitrary system commands on the host operating system, potentially leading to complete system compromise, data theft, or service disruption.`;
  } else if (message.toLowerCase().includes('path traversal') || checkId.toLowerCase().includes('path-traversal')) {
    description += ` Path traversal vulnerabilities allow attackers to access files and directories outside of the intended directory, potentially exposing sensitive configuration files, credentials, or system files.`;
  } else if (message.toLowerCase().includes('ssrf') || checkId.toLowerCase().includes('ssrf')) {
    description += ` Server-Side Request Forgery (SSRF) allows attackers to induce the server to make requests to internal resources, potentially bypassing network controls and accessing internal services.`;
  }
  
  if (source === 'Semgrep') {
    description += ` This vulnerability was detected by static pattern matching in your code.`;
  } else if (source === 'CodeQL') {
    description += ` This vulnerability was identified through semantic code analysis.`;
  } else if (source === 'ShiftLeft') {
    description += ` This vulnerability was detected through program flow analysis.`;
  }
  
  return description;
};

export const mapToOwasp = (checkId: string, message: string): string | null => {
  // Map the vulnerability to OWASP Top 10
  const lowerCheckId = checkId.toLowerCase();
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('injection') || lowerCheckId.includes('injection') || 
      lowerMessage.includes('sql') || lowerCheckId.includes('sql')) {
    return 'A1:2021-Injection';
  } else if (lowerMessage.includes('auth') || lowerCheckId.includes('auth') || 
            lowerMessage.includes('password') || lowerCheckId.includes('password')) {
    return 'A2:2021-Broken Authentication';
  } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
    return 'A3:2021-Cross-Site Scripting';
  } else if (lowerMessage.includes('access control') || lowerCheckId.includes('access-control')) {
    return 'A5:2021-Broken Access Control';
  } else if (lowerMessage.includes('serialize') || lowerCheckId.includes('serialize')) {
    return 'A8:2021-Insecure Deserialization';
  } else if (lowerMessage.includes('log') || lowerCheckId.includes('log')) {
    return 'A9:2021-Insufficient Logging & Monitoring';
  }
  
  return null;
};

export const mapToCwe = (checkId: string, message: string): string | null => {
  // Map the vulnerability to CWE ID
  const lowerCheckId = checkId.toLowerCase();
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('sql injection') || lowerCheckId.includes('sql-injection')) {
    return 'CWE-89';
  } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
    return 'CWE-79';
  } else if (lowerMessage.includes('command injection') || lowerCheckId.includes('command-injection')) {
    return 'CWE-78';
  } else if (lowerMessage.includes('path traversal') || lowerCheckId.includes('path-traversal')) {
    return 'CWE-22';
  } else if (lowerMessage.includes('ssrf') || lowerCheckId.includes('ssrf')) {
    return 'CWE-918';
  } else if (lowerMessage.includes('hard-coded') || lowerCheckId.includes('hardcoded')) {
    return 'CWE-798';
  }
  
  return null;
};

export const generateRemediation = (vuln: any, source: string): string => {
  const checkId = vuln.check_id || '';
  const message = vuln.extra?.message || vuln.message || '';
  const lowerMessage = message.toLowerCase();
  const lowerCheckId = checkId.toLowerCase();
  
  // Generate remediation guidance based on vulnerability type
  if (lowerMessage.includes('sql injection') || lowerCheckId.includes('sql-injection')) {
    return `Use parameterized queries or prepared statements instead of string concatenation for SQL queries. If using an ORM, ensure you're not using raw query methods with user input. Always validate and sanitize user input before using it in database operations.`;
  } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
    return `Sanitize and validate all user input before displaying it in HTML context. Use context-appropriate encoding (HTML, JavaScript, CSS, URL) when displaying user-controlled data. Consider using a Content Security Policy (CSP) as an additional layer of defense.`;
  } else if (lowerMessage.includes('command injection') || lowerCheckId.includes('command-injection')) {
    return `Avoid using shell commands with user input whenever possible. If necessary, use allowlists for permitted commands and arguments, and properly escape all user-provided inputs. Consider using language-specific APIs for the functionality instead of shell commands.`;
  } else if (lowerMessage.includes('path traversal') || lowerCheckId.includes('path-traversal')) {
    return `Validate and sanitize file paths provided by users. Use absolute paths with a whitelist of allowed directories. Normalize paths to remove ".." sequences before validation. Consider using a library designed for safe file operations.`;
  } else if (lowerMessage.includes('hardcoded') || lowerCheckId.includes('hardcoded')) {
    return `Remove hardcoded credentials from the code. Use a secure configuration management system or environment variables to store sensitive values. Consider using a secrets management service for production deployments.`;
  } else if (lowerMessage.includes('ssrf') || lowerCheckId.includes('ssrf')) {
    return `Implement strict URL validation using a whitelist of allowed domains, protocols, and ports. Avoid using user-controlled input in URL-fetching functions. Consider using a dedicated SSRF prevention library.`;
  } else if (lowerMessage.includes('deserialization') || lowerCheckId.includes('deserial')) {
    return `Never deserialize untrusted data. If deserialization is necessary, use safer alternatives like JSON or implement integrity checks. Run deserialization code with minimal privileges and in a sandbox if possible.`;
  } else if (lowerMessage.includes('crypto') || lowerMessage.includes('encrypt') || lowerMessage.includes('cipher')) {
    return `Use established cryptographic libraries and avoid implementing custom cryptographic algorithms. Ensure you are using strong encryption algorithms with proper key sizes and secure modes of operation.`;
  } else if (lowerMessage.includes('csrf') || lowerCheckId.includes('csrf')) {
    return `Implement anti-CSRF tokens in all forms and require them for all state-changing operations. Verify the origin of requests using strict same-origin policies. Use SameSite cookie attributes.`;
  } else if (lowerMessage.includes('auth') || lowerMessage.includes('password') || lowerCheckId.includes('auth')) { 
    return `Implement strong password policies, multi-factor authentication, and rate limiting for authentication attempts. Use secure, standard authentication frameworks instead of custom implementations.`;
  } else if (lowerMessage.includes('cors') || lowerCheckId.includes('cors')) {
    return `Restrict cross-origin resource sharing (CORS) to trusted domains only. Avoid using wildcard origins in production. Be careful with Access-Control-Allow-Credentials and ensure it's only used with specific origins.`;
  }
  
  // Determine source-specific recommendations
  if (source === 'Semgrep' && lowerMessage.includes('pattern')) {
    return `This pattern match indicates a potential security issue. Review the code to ensure it follows secure coding patterns and implement proper validation and sanitization of all inputs.`;
  } else if (source === 'CodeQL' && lowerMessage.includes('taint')) {
    return `This taint flow analysis indicates that untrusted data may reach a sensitive sink. Implement proper validation, sanitization, or encoding at the appropriate points in the data flow path.`;
  } else if (source === 'ShiftLeft' && lowerMessage.includes('leak')) {
    return `This analysis indicates a potential information leak. Ensure sensitive data is properly encrypted during transmission and storage, and implement appropriate access controls.`;
  }
  
  // Default remediation based on the severity
  if (vuln.severity === 'error' || vuln.extra?.severity === 'ERROR') {
    return `This is a high-severity issue that requires immediate attention. Review the code for security issues related to the reported vulnerability and implement proper input validation, output encoding, and strong access controls.`;
  } else if (vuln.severity === 'warning' || vuln.extra?.severity === 'WARNING') {
    return `This is a medium-severity issue that should be addressed. Implement appropriate security controls including data validation and proper error handling to mitigate this risk.`;
  }
  
  // Generic fallback
  return `Review the code for security issues related to the reported vulnerability. Implement proper input validation, output encoding, and access controls appropriate for this specific type of vulnerability.`;
};

// Function to combine results from multiple scanners
export const combineAndStoreResults = async (fileName: string, semgrepData: any, shiftleftData: any, codeqlData: any) => {
  try {
    // Extract vulnerabilities from each scan
    const semgrepVulns = semgrepData?.vulnerabilities || [];
    const shiftleftVulns = shiftleftData?.vulnerabilities || [];
    const codeqlVulns = codeqlData?.vulnerabilities || [];
    
    // Create a set to track unique vulnerabilities (prevent duplicates)
    const uniqueVulnsMap: VulnerabilitiesMap = {};
    
    // Helper function to add vulnerabilities to our map with source tracking and enhanced details
    const addVulnsToMap = (vulns: any[], source: string) => {
      vulns.forEach(vuln => {
        // Generate a key for deduplication
        const key = `${vuln.check_id}:${vuln.path}:${vuln.start?.line || 0}`;
        
        // If we haven't seen this vulnerability or the current one has higher severity, add it
        if (!uniqueVulnsMap[key] || 
           (uniqueVulnsMap[key].severity === 'info' && vuln.severity !== 'info') ||
           (uniqueVulnsMap[key].severity === 'warning' && vuln.severity === 'error')) {
          
          // Add enhanced vulnerability details - make sure it's a proper object with all required fields
          const enhancedVuln = { 
            ...vuln,
            source,
            // Ensure these critical fields exist for backend processing
            check_id: vuln.check_id || `${source}-${Math.random().toString(36).substring(2)}`,
            path: vuln.path || "Unknown",
            start: vuln.start || { line: 0 },
            end: vuln.end || { line: 0 },
            extra: vuln.extra || {}
          };
          
          // Make sure extra object exists and has required fields
          if (!enhancedVuln.extra) {
            enhancedVuln.extra = {};
          }
          
          // Ensure message exists in extra
          if (!enhancedVuln.extra.message) {
            enhancedVuln.extra.message = vuln.message || 'Unknown vulnerability';
          }
          
          // Ensure severity exists and is normalized
          enhancedVuln.extra.severity = (enhancedVuln.extra.severity || vuln.severity || 'INFO').toUpperCase();
          
          // Generate a description if not present
          if (!enhancedVuln.extra.description) {
            enhancedVuln.extra.description = generateDescription(enhancedVuln, source);
          }
          
          // Add OWASP category mapping if available
          if (!enhancedVuln.extra.owasp_category) {
            const owaspMapping = mapToOwasp(enhancedVuln.check_id, enhancedVuln.extra?.message || '');
            if (owaspMapping) {
              enhancedVuln.extra.owasp_category = owaspMapping;
            }
          }
          
          // Add CWE mapping if available
          if (!enhancedVuln.extra.cwe_id) {
            const cweMapping = mapToCwe(enhancedVuln.check_id, enhancedVuln.extra?.message || '');
            if (cweMapping) {
              enhancedVuln.extra.cwe_id = cweMapping;
            }
          }
          
          // Always generate and set remediation regardless of whether one exists
          enhancedVuln.extra.remediation = generateRemediation(enhancedVuln, source);
          
          // Add the vulnerability to the map
          uniqueVulnsMap[key] = enhancedVuln;
        }
      });
    };
    
    // Add all vulnerabilities to our map
    addVulnsToMap(semgrepVulns, 'Semgrep');
    addVulnsToMap(shiftleftVulns, 'ShiftLeft');
    addVulnsToMap(codeqlVulns, 'CodeQL');
    
    // Convert back to array
    const combinedVulns = Object.values(uniqueVulnsMap);
    
    // Calculate average security score
    const semgrepScore = semgrepData?.security_score || 0;
    const shiftleftScore = shiftleftData?.security_score || 0;
    const codeqlScore = codeqlData?.security_score || 0;
    
    // Only include scores that exist (non-zero)
    const scores = [
      semgrepScore > 0 ? semgrepScore : null,
      shiftleftScore > 0 ? shiftleftScore : null,
      codeqlScore > 0 ? codeqlScore : null
    ].filter(score => score !== null) as number[];
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    // Count severities in combined results
    const severityCount = {
      ERROR: combinedVulns.filter(v => v.severity === 'error' || v.extra?.severity === 'ERROR').length,
      WARNING: combinedVulns.filter(v => v.severity === 'warning' || v.extra?.severity === 'WARNING').length,
      INFO: combinedVulns.filter(v => v.severity === 'info' || v.extra?.severity === 'INFO').length
    };
    
    // Create the combined results object
    const combined = {
      file_name: fileName || '',
      security_score: averageScore,
      vulnerabilities: combinedVulns,
      severity_count: severityCount,
      total_vulnerabilities: combinedVulns.length,
      scan_timestamp: new Date().toISOString(),
      scan_metadata: {
        scan_type: 'Combined SAST',
        scan_sources: ['Semgrep', 'ShiftLeft', 'CodeQL'],
        individual_scores: {
          semgrep: semgrepScore,
          shiftleft: shiftleftScore,
          codeql: codeqlScore
        }
      }
    };
    
    // Store in database by sending to API
    try {
      // Make sure all vulnerabilities have the correct structure
      const sanitizedVulnerabilities = combined.vulnerabilities.map(vuln => {
        // Ensure all required fields are present and valid
        return {
          check_id: vuln.check_id || `generic-${Math.random().toString(36).substring(2)}`,
          path: vuln.path || "Unknown",
          start: vuln.start || { line: 0 },
          end: vuln.end || { line: 0 },
          extra: {
            message: vuln.extra?.message || vuln.message || "Unknown vulnerability",
            severity: (vuln.extra?.severity || vuln.severity || "INFO").toUpperCase(),
            description: vuln.extra?.description || "",
            remediation: vuln.extra?.remediation || "",
            ...(vuln.extra || {})
          },
          source: vuln.source || "Combined",
          severity: vuln.severity || "info"
        };
      });
      
      // Create a sanitized copy of the combined results
      const sanitizedCombined = {
        ...combined,
        vulnerabilities: sanitizedVulnerabilities
      };
      
      const response = await fetch('http://localhost:8000/api/v1/scan/combined-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedCombined),
      });
      
      if (!response.ok) {
        console.error('Failed to store combined results in database');
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
      
      return combined;
      
    } catch (error) {
      console.error('Error storing combined results:', error);
      // Return the combined results even if storing fails
      return combined;
    }
  } catch (error) {
    console.error('Error combining scan results:', error);
    throw error;
  }
}; 