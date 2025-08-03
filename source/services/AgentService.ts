import {ApplicationSession} from '../core/session/ApplicationSession.js';

// Placeholder for future agent integration
export interface Agent {
	id: string;
	name: string;
	execute(session: ApplicationSession): Promise<void>;
}

export class AgentService {
	private static instance: AgentService;
	private agents: Map<string, Agent> = new Map();
	
	static getInstance(): AgentService {
		if (!AgentService.instance) {
			AgentService.instance = new AgentService();
		}
		return AgentService.instance;
	}
	
	// Future methods for agent management
	registerAgent(agent: Agent): void {
		this.agents.set(agent.id, agent);
	}
	
	getAgent(agentId: string): Agent | undefined {
		return this.agents.get(agentId);
	}
	
	async attachAgentToSession(agentId: string, session: ApplicationSession): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent ${agentId} not found`);
		}
		
		session.agentId = agentId;
		
		// In the future:
		// - Start agent execution
		// - Set up event forwarding
		// - Handle agent lifecycle
	}
}