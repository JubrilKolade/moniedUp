# Sequelize Guide for MongoDB Developers

Welcome! If you're coming from MongoDB/Mongoose, here's how Sequelize compares:

## Key Concepts

### 1. **Models = Schemas**
- **Mongoose**: `const UserSchema = new Schema({ ... })`
- **Sequelize**: `User.init({ ... }, { sequelize })`

### 2. **Creating Records**
- **Mongoose**: `const user = new User(data); await user.save()`
- **Sequelize**: `const user = await User.create(data)`

### 3. **Finding Records**
- **Mongoose**: `User.findById(id)` or `User.findOne({ email })`
- **Sequelize**: `User.findByPk(id)` or `User.findOne({ where: { email } })`

### 4. **Finding Multiple Records**
- **Mongoose**: `User.find({ tier: 'Tier1' })`
- **Sequelize**: `User.findAll({ where: { tier: 'Tier1' } })`

### 5. **Updating Records**
- **Mongoose**: `user.name = 'New Name'; await user.save()`
- **Sequelize**: `await user.update({ name: 'New Name' })`

### 6. **Deleting Records**
- **Mongoose**: `await user.remove()` or `User.deleteOne({ _id })`
- **Sequelize**: `await user.destroy()` or `User.destroy({ where: { id } })`

### 7. **Populating (Relationships)**
- **Mongoose**: `User.findById(id).populate('accounts')`
- **Sequelize**: `User.findByPk(id, { include: [{ model: Account, as: 'accounts' }] })`

### 8. **Transactions**
- **Mongoose**: `const session = await mongoose.startSession(); session.startTransaction()`
- **Sequelize**: `const transaction = await sequelize.transaction()`

## Common Operations

### Create
```typescript
// Mongoose
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

// Sequelize
const user = await User.create({ name: 'John', email: 'john@example.com' });
```

### Find One
```typescript
// Mongoose
const user = await User.findOne({ email: 'john@example.com' });

// Sequelize
const user = await User.findOne({ where: { email: 'john@example.com' } });
```

### Find All with Conditions
```typescript
// Mongoose
const users = await User.find({ tier: 'Tier1' });

// Sequelize
const users = await User.findAll({ where: { tier: 'Tier1' } });
```

### Update
```typescript
// Mongoose
const user = await User.findById(id);
user.name = 'Jane';
await user.save();

// Sequelize
const user = await User.findByPk(id);
await user.update({ name: 'Jane' });
```

### Delete
```typescript
// Mongoose
await User.findByIdAndDelete(id);

// Sequelize
const user = await User.findByPk(id);
await user.destroy();
```

### Increment/Decrement
```typescript
// Mongoose
await Account.updateOne({ _id: id }, { $inc: { balance: 100 } });

// Sequelize
await account.increment('balance', { by: 100 });
```

### Populate/Include
```typescript
// Mongoose
const account = await Account.findById(id).populate('user');

// Sequelize
const account = await Account.findByPk(id, {
  include: [{ model: User, as: 'user' }]
});
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Make sure your `.env` file has DATABASE_URL**:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
   ```

3. **Run the server**:
   ```bash
   npm run dev
   ```

   Sequelize will automatically create tables if they don't exist (in development mode).

## Next Steps

- All your services are now using Sequelize
- Models are defined in `backend/models/`
- Relationships are set up in `backend/models/index.ts`
- The server will sync models on startup (creates tables automatically)

## Important Notes

- Sequelize uses `toJSON()` to convert models to plain objects (like Mongoose)
- Use `attributes: { exclude: ['password'] }` to exclude fields (like Mongoose select)
- Transactions work similarly but use `sequelize.transaction()` instead of sessions
- All queries return Sequelize model instances, use `.toJSON()` to get plain objects

