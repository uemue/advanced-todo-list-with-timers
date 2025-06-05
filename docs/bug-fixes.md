# バグ修正計画

## 概要
Advanced Todo List with Timersアプリケーションで発見されたバグの修正計画です。

## 修正対象のバグ

### 1. 高優先度: TaskItem.tsx - タイマーメモリリーク

**場所**: `components/TaskItem.tsx:74-97`

**問題**: 
- `useEffect`内で設定したintervalがプロパティ変更時に適切にクリーンアップされていない
- 複数のintervalが同時に実行される可能性がある

**修正方法**:
```typescript
useEffect(() => {
  let logicIntervalId: number | undefined = undefined;

  if (task.timerStatus === TimerStatus.RUNNING) {
    logicIntervalId = window.setInterval(() => {
      // timer logic
    }, 250);
  }

  return () => {
    if (logicIntervalId) {
      clearInterval(logicIntervalId);
    }
  };
}, [dependencies]);
```

**影響**: パフォーマンスの劣化、不正確なタイマー動作

### 2. 中優先度: TaskList.tsx - setTimeoutクリーンアップ未実装

**場所**: `components/TaskList.tsx:48-50`

**問題**:
- 新しくタスクが追加された時の`setTimeout`がクリーンアップされていない
- コンポーネントがアンマウントされた場合にメモリリークが発生

**修正方法**:
```typescript
React.useEffect(() => {
  const newTasks = tasks.filter(task => !prevTasksRef.current.find(pt => pt.id === task.id));
  if (newTasks.length > 0) {
    const newIds = newTasks.map(t => t.id);
    setNewlyAddedTaskIds(currentIds => [...currentIds, ...newIds]);
    
    const timeouts = newIds.map(id => {
      return setTimeout(() => {
        setNewlyAddedTaskIds(currentIds => currentIds.filter(currentId => currentId !== id));
      }, 350);
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }
  prevTasksRef.current = tasks;
}, [tasks]);
```

**影響**: メモリリーク

### 3. 中優先度: TaskItem.tsx - ドラッグハンドル機能不全

**場所**: `components/TaskItem.tsx:168-175`

**問題**:
- ドラッグハンドルボタンにコメントアウトされた古いイベントハンドラーがある
- 現在は視覚的にはボタンだが、実際には機能しない

**修正方法**:
```typescript
// ボタンを単なる視覚的要素に変更するか、適切なドラッグ機能を実装
<div
  className='group/handle cursor-grab p-2 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700'
  aria-label='Drag to reorder task'
>
  <Bars3Icon className='transition-transform duration-150 group-hover/handle:scale-110' />
</div>
```

**影響**: ユーザビリティの混乱

### 4. 低優先度: TaskList.tsx - null参照の可能性

**場所**: `components/TaskList.tsx:113`

**問題**:
- `event.relatedTarget as Node`でnullの可能性がある

**修正方法**:
```typescript
const handleDragLeaveList = (event: React.DragEvent<HTMLDivElement>) => {
  const relatedTarget = event.relatedTarget as Node | null;
  if (relatedTarget && !event.currentTarget.contains(relatedTarget)) {
    setDropTargetIndex(null);
  }
};
```

**影響**: 稀な実行時エラーの可能性

## 修正順序

1. **TaskItem.tsx**: タイマーメモリリーク（高優先度）
2. **TaskList.tsx**: setTimeoutクリーンアップ（中優先度）
3. **TaskItem.tsx**: ドラッグハンドル機能（中優先度）
4. **TaskList.tsx**: null参照チェック（低優先度）

## テスト方針

各修正後に以下をテスト：
- タイマー機能の正常動作
- ドラッグ&ドロップ機能
- メモリリークの確認（開発者ツール使用）
- 通常のタスク操作フロー

## 注意事項

以下は仕様として正常な動作：
- タスクを完了から未完了に戻した時に`accumulatedTime`が保持される（誤操作からの復旧を想定）
- `TimerStatus.FINISHED`状態でも時間の蓄積が続く（超過時間の測定機能）