import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DesignRequirementsChatProps {
  projectId: string;
  onRequirementsUpdated: () => void;
}

export default function DesignRequirementsChat({ projectId, onRequirementsUpdated }: DesignRequirementsChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationState, setConversationState] = useState<{
    step: string;
    data: Record<string, any>;
  }>({
    step: 'dashboard_size',
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

    const { data: designReqs } = await supabase
      .from('design_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (designReqs) {
      if (designReqs.dashboard_size) data.dashboard_size = designReqs.dashboard_size;
      if (designReqs.color_palette?.length > 0) data.color_palette = designReqs.color_palette;
      if (designReqs.fonts?.length > 0) data.fonts = designReqs.fonts;
      if (designReqs.logo_url) data.logo_url = designReqs.logo_url;
      if (designReqs.logo_location) data.logo_location = designReqs.logo_location;
      if (designReqs.additional_requirements) data.additional_requirements = designReqs.additional_requirements;
    }

    return data;
  };

  const determineNextStep = (data: Record<string, any>): string => {
    if (!data.dashboard_size) return 'dashboard_size';
    if (!data.color_palette) return 'color_palette';
    if (!data.fonts) return 'fonts';
    if (!data.logo_url) return 'logo';
    if (!data.additional_requirements) return 'additional';
    return 'complete';
  };

  const getWelcomeMessage = (step: string, data: Record<string, any>): string => {
    if (step === 'complete') {
      return 'All design requirements have been captured. You can update any requirement by typing your changes.';
    }

    switch (step) {
      case 'dashboard_size':
        return 'What size should the dashboard be? (e.g., 1920x1080, 1366x768, responsive)';
      case 'color_palette':
        return 'What color palette should be used? (e.g., blue and white, corporate colors, dark theme)';
      case 'fonts':
        return 'What fonts should be used? (e.g., Arial, Roboto, company brand fonts)';
      case 'logo':
        return 'Should the dashboard include a logo? If yes, where should it be placed? (e.g., top left, center header, none)';
      case 'additional':
        return 'Any additional design requirements? (e.g., specific styling, themes, accessibility requirements)';
      default:
        return 'Let me help you define the design requirements for your dashboard.';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await processUserInput(input.trim());

    setIsTyping(false);
  };

  const processUserInput = async (userInput: string) => {
    const { step, data } = conversationState;
    const updatedData = { ...data };

    switch (step) {
      case 'dashboard_size':
        updatedData.dashboard_size = userInput;
        await saveDesignRequirements({ dashboard_size: userInput });
        break;
      case 'color_palette':
        const colors = userInput.split(',').map(c => c.trim()).filter(c => c);
        updatedData.color_palette = colors;
        await saveDesignRequirements({ color_palette: colors });
        break;
      case 'fonts':
        const fonts = userInput.split(',').map(f => f.trim()).filter(f => f);
        updatedData.fonts = fonts;
        await saveDesignRequirements({ fonts });
        break;
      case 'logo':
        const logoLower = userInput.toLowerCase();
        if (logoLower.includes('none') || logoLower.includes('no')) {
          updatedData.logo_url = '';
          updatedData.logo_location = 'none';
          await saveDesignRequirements({ logo_url: '', logo_location: 'none' });
        } else {
          updatedData.logo_location = userInput;
          await saveDesignRequirements({ logo_location: userInput });
        }
        break;
      case 'additional':
        updatedData.additional_requirements = userInput;
        await saveDesignRequirements({ additional_requirements: userInput });
        break;
      case 'complete':
        await handleFreeformUpdate(userInput);
        return;
    }

    const nextStep = determineNextStep(updatedData);
    setConversationState({ step: nextStep, data: updatedData });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getWelcomeMessage(nextStep, updatedData),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    onRequirementsUpdated();
  };

  const saveDesignRequirements = async (updates: Partial<any>) => {
    const { data: existing } = await supabase
      .from('design_requirements')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('design_requirements')
        .update(updates)
        .eq('project_id', projectId);
    } else {
      await supabase
        .from('design_requirements')
        .insert({ project_id: projectId, ...updates });
    }
  };

  const handleFreeformUpdate = async (userInput: string) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'I have noted your update. The design requirements have been updated.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    onRequirementsUpdated();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-slate-100 text-slate-900 rounded-lg px-4 py-2">
              <Loader className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your response..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
