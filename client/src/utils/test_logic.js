import { fatNormsByAge, smmiNormsByAge, getAllowedFatTargets, getAllowedMuscleTargets, getMuscleStatus } from './calculations.js';

const gender = 'male';
const ageGroup = '25-34';
const fNorms = fatNormsByAge[gender][ageGroup];
const mNorms = smmiNormsByAge[gender][ageGroup];

console.log('fNorms:', fNorms);
console.log('mNorms:', mNorms);

const allowedFatTargets = getAllowedFatTargets(fNorms);
console.log('allowedFatTargets:', allowedFatTargets);

const currentSMM = 30;
const heightM = 1.8;
const currentSmmi = currentSMM / (heightM * heightM);
console.log('currentSmmi:', currentSmmi);

const currentMuscleStatus = getMuscleStatus(currentSmmi, mNorms);
console.log('currentMuscleStatus:', currentMuscleStatus);

const allowedMuscleTargets = getAllowedMuscleTargets(currentMuscleStatus, mNorms);
console.log('allowedMuscleTargets:', allowedMuscleTargets);
