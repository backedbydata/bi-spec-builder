import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RequirementsChatProps {
  projectId: string;
  onRequirementsGenerated: (requirements: any) => void;
  onProjectUpdate: (updates: { name?: string; description?: string; audience?: string; has_appendix_tab?: boolean; has_metric_logic_tab?: boolean }) => void;
  onRequirementsUpdated: () => void;
}

export default function RequirementsChat({ projectId, onRequirementsGenerated, onProjectUpdate, onRequirementsUpdated }: RequirementsChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationState, setConversationState] = useState<{
    step: string;
    data: Record<string, any>;
  }>({
    step: 'name',
    data: {},
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isInitialized) {
      initializeChat();
    }
  }, [projectId, isInitialized]);

  const initializeChat = async () => {
    const existingData = await loadExistingRequirements();
    const nextStep = determineNextStep(existingData);

    setConversationState({
      step: nextStep,
      data: existingData,
    });

    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(nextStep, existingData),
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
    setIsInitialized(true);
  };

  const loadExistingRequirements = async () => {
    const data: Record<string, any> = {};

    const { data: project } = await supabase
      .from('projects')
      .select('name, description, audience, has_appendix_tab, has_metric_logic_tab')
      .eq('id', projectId)
      .maybeSingle();

    if (project) {
      if (project.name) data.name = project.name;
      if (project.description) data.description = project.description;
      if (project.audience) data.audience = project.audience;
      if (project.has_appendix_tab !== null) data.has_appendix = project.has_appendix_tab;
      if (project.has_metric_logic_tab !== null) data.has_metric_logic = project.has_metric_logic_tab;
    }

    const { data: funcReqs } = await supabase
      .from('functional_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (funcReqs) {
      if (funcReqs.data_sources?.length > 0) data.data_sources = funcReqs.data_sources;
      if (funcReqs.metrics?.length > 0) data.metrics = funcReqs.metrics;
    }

    const { data: tabs } = await supabase
      .from('dashboard_tabs')
      .select('name')
      .eq('project_id', projectId)
      .order('order_index');

    if (tabs && tabs.length > 0) {
      data.tabs = tabs.map(t => t.name).join(', ');
    }

    const { data: filters } = await supabase
      .from('filters')
      .select('name')
      .is('tab_id', null);

    if (filters && filters.length > 0) {
      data.filters = filters.map(f => f.name);
    }

    const { data: additionalReqs } = await supabase
      .from('additional_requirements')
      .select('content')
      .eq('project_id', projectId)
      .eq('category', 'functional');

    if (additionalReqs && additionalReqs.length > 0) {
      data.additional_requirements = additionalReqs.map(r => r.content);
    }

    return data;
  };

  const determineNextStep = (data: Record<string, any>): string => {
    if (!data.name) return 'name';
    if (!data.description) return 'description';
    if (!data.audience) return 'audience';
    if (!data.data_sources) return 'data_sources';
    if (!data.metrics) return 'metrics';
    if (!data.tabs) return 'tabs';
    if (!data.filters) return 'filters';
    if (data.has_appendix === undefined) return 'appendix';
    if (data.has_metric_logic === undefined) return 'metric_logic';
    return 'additional';
  };

  const getWelcomeMessage = (step: string, data: Record<string, any>): string => {
    if (step === 'name') {
      return "Hello! I'm here to help you build comprehensive dashboard specifications. Let's start with the basics. What is the name of the dashboard you're creating?";
    }

    if (step === 'additional' || step === 'complete') {
      return `Welcome back! I see you've already captured the core requirements for "${data.name}". You can type any additional requirements you'd like to add, or type "done" if you're finished. You can also ask me to change specific information.`;
    }

    const stepMessages: Record<string, string> = {
      description: `I see the dashboard is named "${data.name}". Can you describe what this dashboard is intended to do?`,
      audience: 'Who will be the primary audience for this dashboard?',
      data_sources: 'What data sources will be needed? Please list them separated by commas.',
      metrics: 'What key metrics need to be displayed? List them separated by commas.',
      tabs: 'How many tabs or pages should this dashboard have?',
      filters: 'What filters should be available? List them separated by commas, or type "none".',
      appendix: 'Will there be an appendix tab with additional information? (yes/no)',
      metric_logic: 'Will there be a Metric Logic tab explaining calculations? (yes/no)',
    };

    return stepMessages[step] || 'How can I help you with your dashboard requirements?';
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(input, conversationState);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationState(response.newState);
      setIsTyping(false);

      if (response.requirements) {
        onRequirementsGenerated(response.requirements);
      }
    }, 1000);
  };

  const generateResponse = (
    userInput: string,
    state: { step: string; data: Record<string, any> }
  ): { message: string; newState: typeof state; requirements?: any } => {
    const newData = { ...state.data };

    switch (state.step) {
      case 'name':
        newData.name = userInput;
        onProjectUpdate({ name: userInput });
        return {
          message: `Great! "${userInput}" is a clear name. Now, can you describe what this dashboard is intended to do? What's the main purpose or goal?`,
          newState: { step: 'description', data: newData },
        };

      case 'description':
        newData.description = userInput;
        onProjectUpdate({ description: userInput });
        return {
          message: 'Perfect! Who will be the primary audience for this dashboard? (e.g., executives, managers, analysts, customers)',
          newState: { step: 'audience', data: newData },
        };

      case 'audience':
        newData.audience = userInput;
        onProjectUpdate({ audience: userInput });
        return {
          message: `Understood. The dashboard will be for ${userInput}. What data sources will be needed? Please list them separated by commas, or type "TBD" if you\'re not sure yet.`,
          newState: { step: 'data_sources', data: newData },
        };

      case 'data_sources':
        newData.data_sources = userInput.split(',').map((s: string) => s.trim());
        saveFunctionalRequirements({ data_sources: newData.data_sources });
        return {
          message: 'Got it. What key metrics need to be displayed on this dashboard? List them separated by commas.',
          newState: { step: 'metrics', data: newData },
        };

      case 'metrics':
        newData.metrics = userInput.split(',').map((s: string) => s.trim());
        saveFunctionalRequirements({ metrics: newData.metrics });
        return {
          message: 'Excellent. How many tabs or pages should this dashboard have? Just give me a number, or list the tab names if you know them.',
          newState: { step: 'tabs', data: newData },
        };

      case 'tabs':
        newData.tabs = userInput;
        saveTabs(userInput);
        return {
          message: 'What filters should be available across the dashboard? List the filter names separated by commas, or type "none" if no filters are needed.',
          newState: { step: 'filters', data: newData },
        };

      case 'filters':
        newData.filters = userInput.toLowerCase() === 'none' ? [] : userInput.split(',').map((s: string) => s.trim());
        saveFilters(newData.filters);
        return {
          message: 'Will there be an appendix tab with additional information? (yes/no)',
          newState: { step: 'appendix', data: newData },
        };


      case 'appendix':
        newData.has_appendix = userInput.toLowerCase().includes('yes');
        onProjectUpdate({ has_appendix_tab: newData.has_appendix });
        return {
          message: 'Will there be a Metric Logic tab explaining calculations? (yes/no)',
          newState: { step: 'metric_logic', data: newData },
        };

      case 'metric_logic':
        newData.has_metric_logic = userInput.toLowerCase().includes('yes');
        onProjectUpdate({ has_metric_logic_tab: newData.has_metric_logic });
        return {
          message: 'Great! I\'ve captured the core functional requirements. Would you like to add any additional requirements or special considerations? Type "done" when finished, or describe what else you need.',
          newState: { step: 'additional', data: newData },
        };

      case 'additional':
        if (userInput.toLowerCase() === 'done') {
          return {
            message: `Perfect! I've compiled all the functional requirements for "${newData.name}". You can now move to the Design Requirements tab to specify branding, or the Tasks tab to add project tasks. The requirements have been saved automatically.`,
            newState: { step: 'complete', data: newData },
            requirements: newData,
          };
        } else if (userInput.toLowerCase() === 'help' || userInput.toLowerCase() === '?') {
          return {
            message: `To edit existing requirements, start your message with "change" or "update" followed by what you want to modify. Examples:\n\n- "change name to Sales Dashboard"\n- "update metrics to Revenue, Profit, Growth"\n- "change data sources to SQL, Snowflake"\n\nTo add additional requirements, just type them normally. Type "done" when finished.`,
            newState: { step: 'additional', data: newData },
          };
        } else if (userInput.toLowerCase().startsWith('change ') || userInput.toLowerCase().startsWith('update ') || userInput.toLowerCase().includes(' to ')) {
          return handleChangeRequest(userInput, newData);
        } else {
          if (!newData.additional_requirements) {
            newData.additional_requirements = [];
          }
          newData.additional_requirements.push(userInput);
          saveAdditionalRequirement(userInput);
          return {
            message: 'Added! Anything else? Type "done" when finished, or type "help" to see how to edit existing requirements.',
            newState: { step: 'additional', data: newData },
          };
        }

      case 'change_request':
        return handleChangeRequest(userInput, newData);

      case 'complete':
        if (userInput.toLowerCase() === 'help' || userInput.toLowerCase() === '?') {
          return {
            message: `To edit existing requirements, start your message with "change" or "update" followed by what you want to modify. Examples:\n\n- "change name to Sales Dashboard"\n- "update metrics to Revenue, Profit, Growth"\n- "change data sources to SQL, Snowflake"\n\nTo add additional requirements, just type them normally.`,
            newState: { step: 'complete', data: newData },
          };
        } else if (userInput.toLowerCase().startsWith('change ') || userInput.toLowerCase().startsWith('update ') || userInput.toLowerCase().includes(' to ')) {
          return handleChangeRequest(userInput, newData);
        }
        if (!newData.additional_requirements) {
          newData.additional_requirements = [];
        }
        newData.additional_requirements.push(userInput);
        saveAdditionalRequirement(userInput);
        return {
          message: 'Added! Type "help" to see how to edit existing requirements.',
          newState: { step: 'complete', data: newData },
        };

      default:
        return {
          message: 'I\'m not sure what to do with that. Could you clarify?',
          newState: state,
        };
    }
  };

  const handleChangeRequest = (userInput: string, data: Record<string, any>) => {
    const input = userInput.toLowerCase();

    const extractValue = (field: string): string => {
      const toMatch = userInput.match(new RegExp(`${field}\\s+to\\s+(.+)`, 'i'));
      if (toMatch) return toMatch[1];

      const changeMatch = userInput.match(/(?:change|update)\s+(.+)/i);
      if (changeMatch) {
        return changeMatch[1].replace(new RegExp(`^${field}\\s*`, 'i'), '').trim();
      }

      return userInput.replace(new RegExp(`.*${field}\\s*`, 'i'), '').trim();
    };

    if (input.includes('name')) {
      const newName = extractValue('name');
      if (newName) {
        data.name = newName;
        onProjectUpdate({ name: newName });
        saveFunctionalRequirements({});
        return {
          message: `Updated the name to "${newName}". What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('description')) {
      const newDesc = extractValue('description');
      if (newDesc) {
        data.description = newDesc;
        onProjectUpdate({ description: newDesc });
        return {
          message: `Updated the description. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('audience')) {
      const newAudience = extractValue('audience');
      if (newAudience) {
        data.audience = newAudience;
        onProjectUpdate({ audience: newAudience });
        return {
          message: `Updated the audience. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('data source')) {
      const value = extractValue('data\\s*source[s]?');
      if (value) {
        const newSources = value.split(',').map((s: string) => s.trim());
        data.data_sources = newSources;
        saveFunctionalRequirements({ data_sources: newSources });
        return {
          message: `Updated the data sources to: ${newSources.join(', ')}. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('metric')) {
      const value = extractValue('metric[s]?');
      if (value) {
        const newMetrics = value.split(',').map((s: string) => s.trim());
        data.metrics = newMetrics;
        saveFunctionalRequirements({ metrics: newMetrics });
        return {
          message: `Updated the metrics to: ${newMetrics.join(', ')}. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('tab')) {
      const newTabs = extractValue('tab[s]?');
      if (newTabs) {
        data.tabs = newTabs;
        saveTabs(newTabs);
        return {
          message: `Updated the tabs. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    if (input.includes('filter')) {
      const value = extractValue('filter[s]?');
      if (value) {
        const newFilters = value.split(',').map((s: string) => s.trim());
        data.filters = newFilters;
        saveFilters(newFilters);
        return {
          message: `Updated the filters to: ${newFilters.join(', ')}. What else would you like to change, or type "done" to finish.`,
          newState: { step: 'additional', data },
        };
      }
    }

    return {
      message: `I'm not sure what you want to change. You can edit:\n\n- name\n- description\n- audience\n- data sources\n- metrics\n- tabs\n- filters\n\nTry: "change metrics to Revenue, Profit, Growth"`,
      newState: { step: 'additional', data },
    };
  };

  const saveFunctionalRequirements = async (updates: any) => {
    const { data: existing } = await supabase
      .from('functional_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('functional_requirements')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('project_id', projectId);
    } else {
      await supabase
        .from('functional_requirements')
        .insert([{ project_id: projectId, ...updates }]);
    }
    onRequirementsUpdated();
  };

  const saveTabs = async (tabsInput: string) => {
    const tabNames = tabsInput.includes(',')
      ? tabsInput.split(',').map((s) => s.trim())
      : [tabsInput.trim()];

    const tabsToInsert = tabNames.map((name, index) => ({
      project_id: projectId,
      name,
      order_index: index,
    }));

    await supabase.from('dashboard_tabs').delete().eq('project_id', projectId);
    await supabase.from('dashboard_tabs').insert(tabsToInsert);
    onRequirementsUpdated();
  };

  const saveFilters = async (filterNames: string[]) => {
    const filtersToInsert = filterNames.map((name) => ({
      tab_id: null,
      name,
      data_source: '',
      multi_select: false,
    }));

    await supabase.from('filters').delete().is('tab_id', null);
    if (filtersToInsert.length > 0) {
      await supabase.from('filters').insert(filtersToInsert);
    }
    onRequirementsUpdated();
  };

  const saveAdditionalRequirement = async (content: string) => {
    await supabase.from('additional_requirements').insert([{
      project_id: projectId,
      category: 'functional',
      content,
    }]);
    onRequirementsUpdated();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-400px)]">
      <div className="flex-1 overflow-y-auto space-y-4 p-6 bg-slate-50 rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'assistant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {message.role === 'assistant' ? (
                <Bot className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div
              className={`flex-1 max-w-3xl ${
                message.role === 'user' ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block px-4 py-3 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-white text-slate-900 border border-slate-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your response..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </div>
  );
}
