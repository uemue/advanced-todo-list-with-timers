# バグ修正記録

## 概要
Advanced Todo List with Timersアプリケーションで発見され、修正済みのバグの記録です。

## 修正済みのバグ

### 1. ✅ 高優先度: TaskItem.tsx - タイマーメモリリーク【修正済み】

**場所**: `components/TaskItem.tsx:73-109`

**問題**: 
- `useEffect`内で設定したintervalがプロパティ変更時に適切にクリーンアップされていない
- 複数のintervalが同時に実行される可能性がある

**修正内容**:
```typescript
useEffect(() => {
  let intervalId: number | null = null;

  if (task.timerStatus === TimerStatus.RUNNING) {
    intervalId = window.setInterval(() => {
      // timer logic with proper cleanup
    }, 250);
  }

  return () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };
}, [task.timerStatus, task.timerStartTime, task.accumulatedTime, task.estimatedDuration, task.id, onSetTaskTimerStatus]);
```

**修正日**: 2025年6月5日（PR #26）

### 2. ✅ 中優先度: TaskList.tsx - setTimeoutクリーンアップ未実装【修正済み】

**場所**: `components/TaskList.tsx:40-60`

**問題**:
- 新しくタスクが追加された時の`setTimeout`がクリーンアップされていない
- コンポーネントがアンマウントされた場合にメモリリークが発生

**修正内容**:
```typescript
useEffect(() => {
  const newTasks = tasks.filter(task => !prevTasksRef.current.find(pt => pt.id === task.id));
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  if (newTasks.length > 0) {
    const newIds = newTasks.map(t => t.id);
    setNewlyAddedTaskIds(currentIds => [...currentIds, ...newIds]);

    newIds.forEach(id => {
      const timer = setTimeout(() => {
        setNewlyAddedTaskIds(currentIds => currentIds.filter(currentId => currentId !== id));
      }, 350);
      timeouts.push(timer);
    });
  }

  prevTasksRef.current = tasks;

  return () => {
    timeouts.forEach(clearTimeout);
  };
}, [tasks]);
```

**修正日**: 2025年6月5日

### 3. ✅ 中優先度: TaskItem.tsx - ドラッグハンドル機能不全【修正済み】

**場所**: `components/TaskItem.tsx:125-175`

**問題**:
- ドラッグハンドルボタンにコメントアウトされた古いイベントハンドラーがある
- 現在は視覚的にはボタンだが、実際には機能しない

**修正内容**:
- TaskItemコンポーネント全体に`draggable`属性と適切なドラッグイベントハンドラーを実装
- ドラッグハンドルは視覚的な要素として機能し、全体のドラッグ操作をサポート
- HTML5 Drag & Drop APIを使用した完全なドラッグ&ドロップ機能を実装

**修正日**: 2025年6月5日

### 4. ✅ 低優先度: TaskList.tsx - null参照の可能性【修正済み】

**場所**: `components/TaskList.tsx:118-124`

**問題**:
- `event.relatedTarget as Node`でnullの可能性がある

**修正内容**:
```typescript
const handleDragLeaveList = (event: React.DragEvent<HTMLDivElement>) => {
  const relatedTarget = event.relatedTarget as Node | null;
  if (relatedTarget && !event.currentTarget.contains(relatedTarget)) {
    setDropTargetIndex(null);
  }
};
```

**修正日**: 2025年6月5日

## 修正完了状況

✅ **全4件のバグ修正が完了**

1. ✅ **TaskItem.tsx**: タイマーメモリリーク（高優先度）- 2025年6月5日完了
2. ✅ **TaskList.tsx**: setTimeoutクリーンアップ（中優先度）- 2025年6月5日完了
3. ✅ **TaskItem.tsx**: ドラッグハンドル機能（中優先度）- 2025年6月5日完了
4. ✅ **TaskList.tsx**: null参照チェック（低優先度）- 2025年6月5日完了

## 実施されたテスト

修正後に追加された包括的なテストスイート：
- ✅ **TimerDisplay.test.tsx**: タイマー機能のテスト
- ✅ **TaskList.test.tsx**: ドラッグ&ドロップ機能のテスト
- ✅ **TaskItem.test.tsx**: タスクアイテム機能のテスト
- ✅ **App.test.tsx**: アプリケーション全体のテスト
- ✅ **Notification.test.tsx**: 通知機能のテスト
- ✅ **useScreenWakeLock.test.tsx**: スクリーンロック機能のテスト

## 注意事項

以下は仕様として正常な動作：
- タスクを完了から未完了に戻した時に`accumulatedTime`が保持される（誤操作からの復旧を想定）
- `TimerStatus.FINISHED`状態でも時間の蓄積が続く（超過時間の測定機能）

## 新たに発見されたバグ

### 5. 🔧 中優先度: beep.ts - AudioContextメモリリーク

**場所**: `utils/beep.ts:6-18`

**問題**:
- 各ビープ音再生時に新しいAudioContextが作成されるが、適切に再利用されていない
- `ctx.close()`がoscillator.onendedで呼ばれるが、AudioContextのライフサイクル管理が不適切

**リスク**:
- 多数の通知によりメモリリークが発生する可能性
- パフォーマンスの低下

**推奨修正**:
```typescript
let audioCtx: AudioContext | null = null;

export function playBeep(duration: number = 200, frequency: number = 880) {
  if (typeof window === 'undefined') return;
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
  if (!AudioCtx) return;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioCtx();
  }

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.1;

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}
```

### 6. 🔧 低優先度: App.tsx - parseInt基数指定漏れ

**場所**: `components/AddTaskForm.tsx:25`

**問題**:
- `parseInt(duration, 10)`で基数が指定されているが、App.tsxでは一般的な慣習に従っていない
- 現在の実装は正しく動作するが、コードの一貫性に欠ける

**リスク**:
- 低リスク（現在のコードは動作する）
- コードレビューで指摘される可能性

### 7. 🔧 低優先度: Notification.tsx - CSS動的クラス名

**場所**: `components/Notification.tsx:113`

**問題**:
- `duration-${ANIMATION_DURATION}`で動的クラス名を生成
- TailwindCSSのPurgeでクラスが削除される可能性

**リスク**:
- 本番環境でスタイルが適用されない可能性
- 現在は動作しているが、将来的に問題になる可能性

**推奨修正**:
```typescript
${isEntering || isExiting ? 'duration-300' : 'duration-0'}
```

### 8. 🔧 低優先度: TaskItem.tsx - setTimeout型注釈不一致

**場所**: `components/TaskItem.tsx:51,60`

**問題**:
- `setTimeout`の戻り値型がブラウザ環境とNode.js環境で異なる
- 現在のコードは動作するが、型安全性に問題

**推奨修正**:
```typescript
const timer = setTimeout(() => {
  setIsVisible(true);
}, 50) as unknown as number;
```

## 今後の保守について

全てのバグが修正され、包括的なテストスイートが追加されました。アプリケーションは安定した状態にあります。新機能追加時は以下に注意してください：

- タイマー関連の機能を変更する際は、必ずクリーンアップ関数を実装する
- 新しいuseEffectを追加する際は、適切な依存配列とクリーンアップを確認する
- ドラッグ&ドロップ機能を変更する際は、既存のテストが通ることを確認する
- AudioContextなどのWebAPIを使用する際は、適切なライフサイクル管理を実装する
- 動的クラス名を使用する際は、TailwindCSSのPurge設定を確認する