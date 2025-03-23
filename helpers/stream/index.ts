import { Client } from "@langchain/langgraph-sdk";
import { ref, computed, reactive, onUnmounted } from "vue";
import type { ComputedRef, Ref } from "vue";

// Import from decomposed modules
import { StreamError, MessageTupleManager, toMessageDict } from './errors';
import { unique, findLastIndex } from './utils';
import { getBranchSequence, getBranchView } from './branches';
import { useThreadHistory, useControllableThreadId } from './history';
import type { StreamOptions, SubmitOptions, StreamInterface } from './types';

/**
 * Main stream function that provides real-time communication with LangGraph
 */
export function useStream<
  TValues = Record<string, any>,
  TOptions extends {
    UpdateType?: any;
    CustomEventType?: any;
  } = { UpdateType: any; CustomEventType: any }
>(options: StreamOptions<TValues, TOptions['UpdateType'], TOptions['CustomEventType']>): StreamInterface<TValues> {
    let { assistantId, messagesKey, onError, onFinish } = options;
    messagesKey ??= "messages";
    
    const client = new Client({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        callerOptions: options.callerOptions,
        defaultHeaders: options.defaultHeaders,
    });
    
    const [threadId, onThreadId] = useControllableThreadId(options);
    const branch = ref<string>("");
    const isLoading = ref<boolean>(false);
    const streamError = ref<Error | undefined>(undefined);
    const streamValues = ref<Record<string, any> | null>(null);
    const messageManager = new MessageTupleManager();
    const isSubmitting = ref<boolean>(false);
    const abortController = ref<AbortController | null>(null);
    const trackStreamModes = ref<string[]>([]);
    
    const trackStreamMode = (...mode: string[]): void => {
        for (const m of mode) {
            if (!trackStreamModes.value.includes(m)) {
                trackStreamModes.value.push(m);
            }
        }
    };
    
    const hasUpdateListener = options.onUpdateEvent != null;
    const hasCustomListener = options.onCustomEvent != null;
    
    const callbackStreamMode = computed(() => {
        const modes: string[] = [];
        if (hasUpdateListener)
            modes.push("updates");
        if (hasCustomListener)
            modes.push("custom");
        return modes;
    });
    
    const clearStreamState = (): void => {
        streamError.value = undefined;
        streamValues.value = null;
    };
    
    // Thread history
    const history = useThreadHistory(threadId as Ref<string | null>, client, clearStreamState, isSubmitting);
    
    const getMessages = (value: Record<string, any>): any[] => 
        Array.isArray(value[messagesKey]) ? value[messagesKey] : [];
    
    const branchData = computed(() => {
        const { rootSequence, paths } = getBranchSequence(history.data.value);
        const { history: flatHistory, branchByCheckpoint } = getBranchView(rootSequence, paths, branch.value);
        return {
            rootSequence,
            paths,
            flatHistory,
            branchByCheckpoint
        };
    });
    
    const flatHistory = computed(() => branchData.value.flatHistory);
    const threadHead = computed(() => flatHistory.value.at(-1));
    const historyValues = computed(() => threadHead.value?.values ?? {});
    
    const historyError = computed(() => {
        const error = threadHead.value?.tasks?.at(-1)?.error;
        if (error == null)
            return undefined;
        try {
            const parsed = JSON.parse(error);
            if (StreamError.isStructuredError(parsed)) {
                return new StreamError(parsed);
            }
            return parsed;
        }
        catch {
            // do nothing
        }
        return error;
    });
    
    const messageMetadata = computed(() => {
        const alreadyShown = new Set<string>();
        return getMessages(historyValues.value).map((message: any, idx: number) => {
            const messageId = message.id ?? idx;
            const firstSeenIdx = findLastIndex(history.data.value, (state: any) => 
                getMessages(state.values)
                    .map((m: any, idx: number) => m.id ?? idx)
                    .includes(messageId)
            );
            const firstSeen = history.data.value[firstSeenIdx];
            let messageBranch = firstSeen && firstSeen.checkpoint
                ? branchData.value.branchByCheckpoint[firstSeen.checkpoint.checkpoint_id]
                : undefined;
            if (!messageBranch?.branch?.length)
                messageBranch = undefined;
            // serialize branches
            const optionsShown = messageBranch?.branchOptions?.flat(2).join(",");
            if (optionsShown) {
                if (alreadyShown.has(optionsShown))
                    messageBranch = undefined;
                alreadyShown.add(optionsShown);
            }
            return {
                messageId: messageId.toString(),
                firstSeenState: firstSeen,
                branch: messageBranch?.branch,
                branchOptions: messageBranch?.branchOptions,
            };
        });
    });
    
    const stop = (): void => {
        if (abortController.value != null)
            abortController.value.abort();
        abortController.value = null;
    };
    
    onUnmounted(() => {
        stop();
    });
    
    const submit = async (values: any, submitOptions?: SubmitOptions): Promise<void> => {
        try {
            isLoading.value = true;
            streamError.value = undefined;
            isSubmitting.value = true;
            abortController.value = new AbortController();
            
            let usableThreadId = threadId instanceof Object ? threadId.value : null;
            if (!usableThreadId) {
                const thread = await client.threads.create();
                onThreadId(thread.thread_id);
                usableThreadId = thread.thread_id;
            }
            
            const streamMode = unique([
                ...(submitOptions?.streamMode ?? []),
                ...trackStreamModes.value,
                ...callbackStreamMode.value,
            ]);
            
            const checkpoint = submitOptions?.checkpoint ?? threadHead.value?.checkpoint ?? undefined;
            if (checkpoint != null) {
                // @ts-ignore
                delete checkpoint.thread_id;
            }
            
            // @ts-ignore - Need to bypass type checking for the stream method due to API differences
            const run = await client.runs.stream(usableThreadId, assistantId, {
                input: values,
                config: submitOptions?.config,
                command: submitOptions?.command,
                interruptBefore: submitOptions?.interruptBefore,
                interruptAfter: submitOptions?.interruptAfter,
                metadata: submitOptions?.metadata,
                multitaskStrategy: submitOptions?.multitaskStrategy,
                onCompletion: submitOptions?.onCompletion,
                onDisconnect: submitOptions?.onDisconnect ?? "cancel",
                signal: abortController.value?.signal,
                checkpoint,
                streamMode,
            });
            
            // Unbranch things
            const newPath = submitOptions?.checkpoint?.checkpoint_id
                ? branchData.value.branchByCheckpoint[submitOptions?.checkpoint?.checkpoint_id]?.branch
                : undefined;
            if (newPath != null)
                branch.value = newPath ?? "";
                
            // Assumption: we're setting the initial value
            // Used for instant feedback
            const initialValues = { ...historyValues.value };
            if (submitOptions?.optimisticValues != null) {
                streamValues.value = {
                    ...initialValues,
                    ...(typeof submitOptions.optimisticValues === "function"
                        ? submitOptions.optimisticValues(initialValues)
                        : submitOptions.optimisticValues),
                };
            } else {
                streamValues.value = initialValues;
            }
            
            let streamErrorOccurred: StreamError | undefined;
            for await (const { event, data } of run) {
                if (event === "error") {
                    streamErrorOccurred = new StreamError(data);
                    break;
                }
                if (event === "updates")
                    options.onUpdateEvent?.(data);
                if (event === "custom")
                    options.onCustomEvent?.(data, {
                        mutate: (update: any) => {
                            const prev = streamValues.value;
                            if (prev == null) return;
                            
                            streamValues.value = {
                                ...prev,
                                ...(typeof update === "function" ? update(prev as TValues) : update),
                            };
                        },
                    });
                if (event === "metadata")
                    options.onMetadataEvent?.(data);
                if (event === "values")
                    streamValues.value = data;
                if (event === "messages") {
                    const [serialized] = data;
                    const messageId = messageManager.add(serialized);
                    if (!messageId) {
                        console.warn("Failed to add message to manager, no message ID found");
                        continue;
                    }
                    
                    const currentValues = { ...historyValues.value, ...streamValues.value };
                    // Assumption: we're concatenating the message
                    const messages = getMessages(currentValues).slice();
                    const result = messageManager.get(messageId, messages.length);
                    const { chunk, index } = result ?? {};
                    if (!chunk || index == null) continue;
                    
                    messages[index] = toMessageDict(chunk as any);
                    streamValues.value = { ...currentValues, [messagesKey]: messages };
                }
            }
            
            // TODO: stream created checkpoints to avoid an unnecessary network request
            const result = await history.mutate(usableThreadId);
            streamValues.value = null;
            
            if (streamErrorOccurred != null)
                throw streamErrorOccurred;
                
            const lastHead = result.at(0);
            if (lastHead)
                onFinish?.(lastHead);
        }
        catch (error) {
            if (!(error instanceof Error &&
                (error.name === "AbortError" || error.name === "TimeoutError"))) {
                console.error(error);
                streamError.value = error as Error;
                onError?.(error as Error);
            }
        }
        finally {
            isLoading.value = false;
            // Assumption: messages are already handled, we can clear the manager
            messageManager.clear();
            isSubmitting.value = false;
            abortController.value = null;
        }
    };
    
    // Combine reactive values
    const error = computed(() => streamError.value ?? historyError.value);
    const values = computed(() => streamValues.value ?? historyValues.value);
    
    const interrupt = computed(() => {
        // Don't show the interrupt if the stream is loading
        if (isLoading.value)
            return undefined;
        const interrupts = threadHead.value?.tasks?.at(-1)?.interrupts;
        if (interrupts == null || interrupts.length === 0) {
            // check if there's a next task present
            const next = threadHead.value?.next ?? [];
            if (!next.length || error.value != null)
                return undefined;
            return { when: "breakpoint" };
        }
        // Return only the current interrupt
        return interrupts.at(-1);
    });
    
    const messages = computed(() => {
        trackStreamMode("messages-tuple", "values");
        return getMessages(values.value);
    });
    
    const getMessagesMetadata = (message: any, index?: number) => {
        trackStreamMode("messages-tuple", "values");
        return messageMetadata.value?.find((m) => m.messageId === (message.id ?? index));
    };
    
    // Return the stream interface
    return {
        // Properties
        get values() {
            trackStreamMode("values");
            return values.value;
        },
        client,
        assistantId,
        error,
        isLoading,
        branch,
        history: flatHistory,
        experimental_branchTree: computed(() => branchData.value.rootSequence),
        get interrupt() {
            return interrupt.value;
        },
        get messages() {
            return messages.value;
        },
        
        // Methods
        stop,
        submit,
        setBranch: (newBranch: string) => { branch.value = newBranch; },
        getMessagesMetadata,
    };
}

// Re-export types and utilities from modules
export * from './types';
export * from './errors';
export * from './utils';
export * from './branches';
export * from './history'; 