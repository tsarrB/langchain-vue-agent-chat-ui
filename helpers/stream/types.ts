import { Client } from "@langchain/langgraph-sdk";
import type { ComputedRef, Ref } from "vue";
import type { SequenceNode } from "./branches";

/**
 * Options for the stream functionality
 */
export interface StreamOptions<TValues = any, TUpdateType = any, TCustomEventType = any> {
  apiUrl: string;
  apiKey?: string;
  assistantId: string;
  threadId?: MaybeRef<string | null>;
  messagesKey?: string;
  onError?: (error: Error) => void;
  onFinish?: (state: any) => void;
  onUpdateEvent?: (data: TUpdateType) => void;
  onCustomEvent?: (data: TCustomEventType, options: { 
    mutate: (updater: ((prev: TValues) => Partial<TValues> | TValues) | Partial<TValues>) => void 
  }) => void;
  onMetadataEvent?: (data: any) => void;
  onThreadId?: (threadId: string) => void;
  callerOptions?: Record<string, any>;
  defaultHeaders?: Record<string, any>;
}

/**
 * Options for the submit function
 */
export interface SubmitOptions {
  streamMode?: string[];
  checkpoint?: any;
  config?: any;
  command?: string;
  interruptBefore?: any;
  interruptAfter?: any;
  metadata?: any;
  multitaskStrategy?: string;
  onCompletion?: any;
  onDisconnect?: string;
  optimisticValues?: Record<string, any> | ((values: Record<string, any>) => Record<string, any>);
}

/**
 * Interface for the return value of useStream
 */
export interface StreamInterface<T = any> {
  values: Record<string, any>;
  client: Client;
  assistantId: string;
  error: ComputedRef<Error | undefined>;
  isLoading: Ref<boolean>;
  branch: Ref<string>;
  history: ComputedRef<any[]>;
  experimental_branchTree: ComputedRef<SequenceNode>;
  interrupt: any;
  messages: any[];
  stop: () => void;
  submit: (values: any, submitOptions?: SubmitOptions) => Promise<void>;
  setBranch: (newBranch: string) => void;
  getMessagesMetadata: (message: any, index?: number) => any;
} 