import { mount } from '@vue/test-utils';
import Deployment from '@/views/Deployment.vue';
import { createStore } from 'vuex';
import { describe, it, expect } from 'vitest';

const mockConfig = {
  state: {
    config: {
      selectedProject: 'project1',
      selectedEnvironment: 'env1',
      projects: [
        {
          id: 'project1',
          name: 'Project 1',
          repos: [{ name: 'Repo 1', path: '/path/to/repo1' }],
          dockerLogin: {
            env1: {
              registry: 'example.com',
              username: 'user',
              password: 'pass',
            },
          },
        },
      ],
      environments: ['env1', 'env2'],
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          command: 'echo {param1}',
          hasOutputField: false,
          hasOutputReference: false,
          hasDirectory: false,
          executionMode: 'sync',
          shellType: 'bash',
          environmentSpecificParameters: [{ name: 'param1', value: 'value1' }],
        },
      ],
      stepCombinations: [
        {
          id: 'comb1',
          name: 'Combination 1',
          steps: ['step1'],
          projectId: 'project1',
          environment: 'env1',
        },
      ],
    },
  },
  getters: {
    getConfig: (state) => state.config,
  },
};

const store = createStore(mockConfig);

describe('Deployment.vue', () => {
  it('should render environment-specific parameters', async () => {
    const wrapper = mount(Deployment, {
      global: {
        plugins: [store],
      },
    });

    await wrapper.setData({
      selectedCombinationId: 'comb1',
      selectedRepos: ['Repo 1'],
    });

    expect(wrapper.find('input[placeholder="請輸入 param1 的值"]').exists()).toBe(true);
  });

  it('should execute step with environment-specific parameters', async () => {
    const wrapper = mount(Deployment, {
      global: {
        plugins: [store],
      },
    });

    await wrapper.setData({
      selectedCombinationId: 'comb1',
      selectedRepos: ['Repo 1'],
      environmentSpecificParameters: { param1: 'testValue' },
    });

    await wrapper.find('.execute-button').trigger('click');

    expect(wrapper.vm.output).toContain('testValue');
  });
});
