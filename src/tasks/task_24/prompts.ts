export const SYSTEM_PROMPT = `You are an expert code editor tasked with applying a specific edit plan to a section of code. Your goal is to modify the code according to the plan while maintaining the codebase's style and structure. Please output your response as a code block sketching out the edit. You should indicate what you will do to edit the code before outputting the edit block.`;

export const formatMessages = (editPlan: string, filePath: string, section: string) => {
  return [
    {
      role: "system" as const,
      content: SYSTEM_PROMPT,
    },
    {
      role: "user" as const,
      content: `I will provide you with: 1. An edit plan describing what the user wanted changed across all their files 2. The file path and section of code to modify 3. The current contents of that section Please output a simplified version of the code block that highlights the changes necessary and adds comments to indicate where unchanged code has been skipped. For example:
\`\`\`language:file_path
// ... existing code ...
{{ edit_1 }}
// ... existing code ...
{{ edit_2 }}
// ... existing code ...
\`\`\`
And, you should make sure the edit looks well-formed. This means that for whatever exists before the edit region, use the \`// ... existing code ...\` comment to indicate its absence. and the same thing for the code after omitted.
# Edit Plan:
${editPlan}
# File:
${filePath}
# Section to modify (lines 1 to 1):
${section}

Now please edit to code block according to the instructions in the format specified.`,
    },
  ];
};
