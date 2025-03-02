import * as fs from 'fs';
import { JSDOM } from 'jsdom';

interface Deputy {
    fullName: string;
    email: string;
}

function processDeputyName(nameText: string): Deputy {
    // Remove any text in brackets
    nameText = nameText.replace(/\[.*?\]/g, '').trim();
    
    // Split the name into parts and filter out empty strings
    const nameParts = nameText.split(' ').filter(part => part.length > 0);
    
    // Handle the name format: "Nazwisko [Drugie Imię] Pierwsze Imię"
    let firstName: string;
    let lastName: string;

    if (nameParts.length >= 2) {
        // Last element is always the first name
        firstName = nameParts[nameParts.length - 1];
        // First element is always the last name
        lastName = nameParts[0];
    } else {
        // Fallback for unexpected format
        firstName = nameParts[nameParts.length - 1];
        lastName = nameParts[0] || '';
    }
    
    // Create email
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sejm.pl`;
    
    // Remove Polish diacritics for email
    const normalizedEmail = email
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
        .replace(/Ł/g, 'l');

    return {
        fullName: nameText,
        email: normalizedEmail
    };
}

function parseHTML(html: string): string[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Find all deputy names using class="deputyName"
    const deputyElements = document.querySelectorAll('.deputyName.notranslate');
    const emails: string[] = [];

    deputyElements.forEach((element: Element) => {
        const deputyName = element.textContent || '';
        const deputy = processDeputyName(deputyName);
        emails.push(deputy.email);
    });
    
    return emails;
}

function generateMarkdown(emails: string[]): string {
    const date = new Date().toISOString().split('T')[0];
    return `# Sejm Deputies Email List
Generated on: ${date}

## Email Addresses
${emails.join(', ')}

## Statistics
Total number of deputies: ${emails.length}
`;
}

// Main execution
try {
    const htmlContent = fs.readFileSync('paste.txt', 'utf8');
    const emails = parseHTML(htmlContent);
    const markdownContent = generateMarkdown(emails);
    
    // Save to markdown file
    fs.writeFileSync('deputies_emails.md', markdownContent);
    console.log('Successfully generated deputies_emails.md');

    // Also print first few emails for verification
    console.log('\nFirst 5 generated emails for verification:');
    emails.slice(0, 5).forEach(email => console.log(email));
} catch (error) {
    console.error('Error:', error);
}