// 自然排卵回归：每个排卵期的总卵数由额外排卵倾向决定，与经期长度无关。
import assert from 'node:assert/strict';
import test from 'node:test';

import { applyToolCall } from '../scripts/tools.js';

function makeChatState({ menstrualLengthRatio = 1, orgasmOvulationAmount = 1, withCandidate = false } = {}) {
  return {
    characters: {
      F: {
        name: 'F',
        initialized: true,
        profile: {
          base: {
            stage: '排卵期', days: 0, race: '人类', vitality: 100,
            vitalityLevel: 4, psyStressLevel: 4, libido: 20, uterinePressure: 0, eggs: 0,
            conceptionCandidates: withCandidate ? [{ male: 'A', race: '人类', derivedType: null, competitionWeight: 20 }] : [],
          },
          bio: {
            menstrualLengthRatio,
            orgasmOvulationAmount,
            impregnationDifficulty: 1,
            gestationSpeciesSpeed: 1,
            birthDifficulty: 1,
            breedTolerance: 1,
          },
          pregnant: { fetuses: [], fetusesCount: 0 },
          immune: {}, experience: {}, metabolism: {}, cooldown: {},
        },
      },
    },
  };
}

function eggsAfterOneDay(options, withCandidate = true) {
  const chatState = makeChatState({ ...options, withCandidate });
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  return chatState.characters.F.profile.base.eggs;
}

test('自然排卵每周期只结算一次，且有候选时在同次结算消耗', () => {
  // 每周期排出 1 颗基础卵加额外排卵倾向；排卵窗口长度不改变总量。
  for (const options of [
    { menstrualLengthRatio: 1, orgasmOvulationAmount: 1 },
    { menstrualLengthRatio: 3, orgasmOvulationAmount: 0 },
    { menstrualLengthRatio: 4, orgasmOvulationAmount: 1 },
    { menstrualLengthRatio: 0.75, orgasmOvulationAmount: 8 },
  ]) {
    assert.equal(
      eggsAfterOneDay(options, false),
      1 + options.orgasmOvulationAmount,
      JSON.stringify(options),
    );
    assert.equal(eggsAfterOneDay(options, true), 0, `${JSON.stringify(options)} 应在同次结算中处理候选卵`);
  }
});

test('超长周期在整个排卵窗口内只排一次', () => {
  // 经期倍率 13（约一年）→ 排卵期 26 天；旧算法会逐日累加到 26 颗
  const chatState = makeChatState({ menstrualLengthRatio: 13, orgasmOvulationAmount: 1, withCandidate: true });
  for (let i = 0; i < 10; i += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 2 } });
  }
  const profile = chatState.characters.F.profile;
  assert.equal(profile.base.stage, '排卵期', '推进 20 天后仍应在排卵期内');
  assert.equal(profile.base.eggs, 0, '整个窗口内只排一次并完成结算');

  const noCandidate = makeChatState({ menstrualLengthRatio: 13, orgasmOvulationAmount: 1, withCandidate: false });
  for (let i = 0; i < 10; i += 1) {
    applyToolCall(noCandidate, { name: 'bsPassedTime', arguments: { day: 2 } });
  }
  assert.equal(noCandidate.characters.F.profile.base.eggs, 2, '没有候选时保留基础卵与额外排卵');
  assert.equal(profile.cooldown.naturalOvulationUsed, true, '本周期已排卵的旗标应保留');
});

test('高潮诱发排卵排出的卵不会被自然排卵覆盖', () => {
  const chatState = makeChatState({ menstrualLengthRatio: 1, orgasmOvulationAmount: 8, withCandidate: true });
  // 先手动堆上高潮诱发排卵的份额，再推进时间触发自然排卵
  chatState.characters.F.profile.base.eggs = 8;
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  // applyToolCall 内部会 clone 后写回，必须重新取引用
  assert.equal(chatState.characters.F.profile.base.eggs, 0, '自然排卵应叠加并在同次结算中消耗');
});

test('成熟卵子遇到精液时立即尝试受精，之后排出精液不影响胚胎', () => {
  const chatState = makeChatState();
  chatState.characters.F.profile.base.eggs = 1;
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    applyToolCall(chatState, {
      name: 'bsAddSperm',
      arguments: { female: 'F', male: 'A', race: '人类', amount: 30, ejaculatedInside: true, protected: false },
    });
  } finally {
    Math.random = originalRandom;
  }

  const profile = chatState.characters.F.profile;
  assert.equal(profile.pregnant.fetuses.length, 0, '精液进入时不应立即生成胚胎');
  assert.equal(profile.base.eggs, 1, '精液进入时不应消耗成熟卵子');
  assert.equal(profile.base.conceptionCandidates.length, 1, '精液进入时应登记本周期竞争资格');

  const passRandom = Math.random;
  Math.random = () => 0;
  try {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  } finally {
    Math.random = passRandom;
  }
  assert.equal(chatState.characters.F.profile.pregnant.fetuses.length, 3, '排卵结算应处理自然排卵与已有卵子');

  applyToolCall(chatState, {
    name: 'bsDrainSperm',
    arguments: { female: 'F', amount: 30 },
  });
  const afterDrain = chatState.characters.F.profile;
  assert.equal(afterDrain.base.sperms.length, 0, '排出残留精液不应撤销已经发生的受精');
  assert.equal(afterDrain.pregnant.fetuses.length, 3);
});

test('没有候选时高潮诱发排卵排出的卵不会被自然排卵覆盖', () => {
  const chatState = makeChatState({ menstrualLengthRatio: 1, orgasmOvulationAmount: 8 });
  chatState.characters.F.profile.base.eggs = 8;
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  // applyToolCall 内部会 clone 后写回，必须重新取引用
  assert.equal(chatState.characters.F.profile.base.eggs, 17, '自然排卵应叠加而不是封顶覆盖');
});

const orgasm = (chatState) => applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: 'F', options: { libido: 9999 } } });
const setStage = (chatState, stage) => applyToolCall(chatState, { name: 'bsSetMenstrualPhases', arguments: { female: 'F', stage } });
const F = (chatState) => chatState.characters.F.profile;

test('高潮排卵按当前活力占比排出：满活力全排，活力 0 一颗不排但仍用掉这次机会', () => {
  const full = makeChatState({ orgasmOvulationAmount: 3 });
  F(full).base.vitality = 125; // 活力等级 4 的上限
  orgasm(full);
  assert.equal(F(full).base.eggs, 3);
  assert.equal(F(full).base.libido, 0);
  assert.equal(F(full).cooldown.orgasmOvulationUsed, true);

  const drained = makeChatState({ orgasmOvulationAmount: 3 });
  F(drained).base.vitality = 0;
  orgasm(drained);
  assert.equal(F(drained).base.eggs, 0);
  assert.equal(F(drained).base.libido, 0, '高潮照样发生');
  assert.equal(F(drained).cooldown.orgasmOvulationUsed, true);
  assert.match(F(drained).notify.secondly, /没有额外排卵/);
});

test('没有额外排卵倾向的物种不会因高潮排卵', () => {
  const elf = makeChatState({ orgasmOvulationAmount: 0 });
  F(elf).base.vitality = 125;
  orgasm(elf);
  assert.equal(F(elf).base.eggs, 0);
  assert.ok(!F(elf).cooldown.orgasmOvulationUsed, '没有触发，不占用冷却');
});

test('排卵期内只有一次高潮排卵，进入黄体期刷新一次，月经期全部重置', () => {
  const chatState = makeChatState({ orgasmOvulationAmount: 1 });
  F(chatState).base.vitality = 125;
  orgasm(chatState);
  orgasm(chatState);
  assert.equal(F(chatState).base.eggs, 1, '排卵期内第二次高潮不再加卵');

  // 自然推进进入黄体期：冷却刷新一次
  for (let day = 0; day < 6 && F(chatState).base.stage !== '黄体期'; day += 1) {
    applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  }
  assert.equal(F(chatState).base.stage, '黄体期');
  assert.equal(F(chatState).cooldown.orgasmOvulationUsed, false);
  assert.equal(F(chatState).cooldown.lutealOrgasmRefreshed, true);
  const eggsBefore = F(chatState).base.eggs;
  F(chatState).base.vitality = 125;
  orgasm(chatState);
  assert.equal(F(chatState).base.eggs, eggsBefore + 1, '黄体期可再触发一次');
  applyToolCall(chatState, { name: 'bsPassedTime', arguments: { day: 1 } });
  assert.equal(F(chatState).cooldown.orgasmOvulationUsed, true, '同一个黄体期不会第二次刷新');

  setStage(chatState, '月经期');
  assert.equal(F(chatState).cooldown.orgasmOvulationUsed, false);
  assert.equal(F(chatState).cooldown.lutealOrgasmRefreshed, false);
});

test('手动切到黄体期也吃到那一次刷新', () => {
  const chatState = makeChatState({ orgasmOvulationAmount: 1 });
  F(chatState).base.vitality = 125;
  orgasm(chatState);
  setStage(chatState, '黄体期');
  assert.equal(F(chatState).cooldown.orgasmOvulationUsed, false);
  assert.equal(F(chatState).cooldown.lutealOrgasmRefreshed, true);
});

test('options.orgasm 推满性欲走高潮排卵；冷却中或不排卵的物种也让性欲归零，不卡在上限', () => {
  const climax = (chatState) => applyToolCall(chatState, { name: 'bsUpdateCharacterStatus', arguments: { female: 'F', options: { orgasm: true } } });
  const chatState = makeChatState({ orgasmOvulationAmount: 1 });
  F(chatState).base.vitality = 125;
  climax(chatState);
  assert.equal(F(chatState).base.eggs, 1, '第一次高潮排卵');
  assert.equal(F(chatState).base.libido, 0);
  assert.ok(F(chatState).metabolism.milk > 0, '性欲推满照样带出乳意');

  F(chatState).base.libido = 40;
  climax(chatState);
  assert.equal(F(chatState).base.eggs, 1, '冷却中不再排卵');
  assert.equal(F(chatState).base.libido, 0, '冷却中高潮仍让性欲归零');
  assert.match(F(chatState).notify.secondly, /达到高潮，性欲归零/);

  const elf = makeChatState({ orgasmOvulationAmount: 0 });
  climax(elf);
  assert.equal(F(elf).base.eggs, 0);
  assert.equal(F(elf).base.libido, 0, '不排卵的物种高潮后性欲也归零');
});
