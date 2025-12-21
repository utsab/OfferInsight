# WSL Process Management Quick Reference

## Checking Processes

### 1. List all processes (similar to Task Manager)
```bash
ps aux
```
Shows all running processes with details like PID, CPU usage, memory, and command.

### 2. Search for specific processes
```bash
ps aux | grep <process_name>
```
Example: `ps aux | grep node` - finds all Node.js processes

### 3. Interactive process viewer (press 'q' to quit)
```bash
top
```
Shows real-time process information, CPU and memory usage.

### 4. Better interactive viewer (if installed)
```bash
htop
```
If not installed: `sudo apt install htop`

### 5. List processes in tree format
```bash
pstree
```
Shows processes in a hierarchical tree structure.

### 6. Check processes using a specific port
```bash
lsof -i :<port_number>
# or
sudo netstat -tulpn | grep :<port_number>
```
Example: `lsof -i :3000` - finds what's using port 3000

## Killing Processes

### 1. Kill by Process ID (PID)
```bash
kill <PID>
```
Sends SIGTERM signal (graceful shutdown). Use `ps aux | grep <name>` to find the PID.

### 2. Force kill (if normal kill doesn't work)
```bash
kill -9 <PID>
```
Sends SIGKILL signal (immediate termination, cannot be ignored).

### 3. Kill by process name
```bash
killall <process_name>
```
Example: `killall node` - kills all Node.js processes

### 4. Kill by process name pattern
```bash
pkill <pattern>
```
Example: `pkill -f "next dev"` - kills processes matching the pattern

### 5. Kill process using a specific port
```bash
# First find the PID
lsof -ti :<port_number> | xargs kill
# Or force kill
lsof -ti :<port_number> | xargs kill -9
```

## Common Use Cases

### Stop a Next.js development server (port 3000)
```bash
# Find and kill
lsof -ti :3000 | xargs kill -9
# Or
sudo kill -9 $(lsof -t -i:3000)
```

### Stop all Node.js processes
```bash
killall node
# Or if that doesn't work
pkill node
```

### Stop a specific process by name
```bash
ps aux | grep <process_name>
# Note the PID from the output, then:
kill <PID>
```

### View what's using your ports
```bash
sudo netstat -tulpn
```

## Tips

1. **Always check first**: Use `ps aux | grep <name>` before killing to confirm you're targeting the right process
2. **Try graceful first**: Use `kill` before `kill -9` to allow processes to clean up
3. **Use pkill/killall carefully**: These can kill multiple processes matching the name
4. **Check ports**: If a port is in use, use `lsof` or `netstat` to find the process

## Finding PIDs quickly

```bash
# Get PID of a process by name
pgrep <process_name>

# Get PID and kill in one command
pkill <process_name>

# Get PID of process using a port
lsof -ti :<port>
```

