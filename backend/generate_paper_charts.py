import csv
import re
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans', 'Arial']
plt.rcParams['axes.unicode_minus'] = False

output_dir = r'd:\Website_for_ProbingMemes\Website_for_ProbingMemes\backend\paper_charts'
os.makedirs(output_dir, exist_ok=True)

files = {
    'zf_64': r'd:\Website_for_ProbingMemes\Website_for_ProbingMemes\backend\leaderboard_data\data\cpu_groups\zf_64\zf_64.csv',
    'zf_65': r'd:\Website_for_ProbingMemes\Website_for_ProbingMemes\backend\leaderboard_data\data\cpu_groups\zf_65\zf_65.csv',
    'zf_amd': r'd:\Website_for_ProbingMemes\Website_for_ProbingMemes\backend\leaderboard_data\data\cpu_groups\zf_amd\zf_amd.csv'
}

records = []
for server, filepath in files.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            bench = row['benchmark_name']
            workload = row['workload_name']
            for r in range(1, 17):
                time_key = f'round_{r}_time'
                param_key = f'round_{r}_param'
                if time_key in row and param_key in row and row[time_key]:
                    try:
                        t = float(row[time_key])
                    except ValueError:
                        continue
                    param_str = row[param_key]
                    
                    threads_m = re.search(r'--threads\s+(\d+)', param_str)
                    threads = int(threads_m.group(1)) if threads_m else None
                    
                    opt_m = re.search(r'--opt\s+(O[0-3s]|-O[1-3])', param_str)
                    opt = opt_m.group(1) if opt_m else None
                    if opt and opt.startswith('-'): opt = opt[1:]
                    
                    compiler = None
                    if 'setup: --compiler' in param_str:
                        comp_m = re.search(r'--compiler\s+(\w+)', param_str)
                        if comp_m:
                            compiler = comp_m.group(1)
                    elif 'gcc' in workload:
                        compiler = 'gcc'
                    elif 'clang' in workload:
                        compiler = 'clang'
                        
                    data_val = None
                    tokens = re.findall(r'--([a-zA-Z0-9_-]+)\s+([^\s;]+)', param_str)
                    for k, v in tokens:
                        if k not in ['threads', 'opt', 'compiler']:
                            try:
                                data_val = float(v)
                                break
                            except ValueError:
                                pass
                                
                    records.append({
                        'server': server,
                        'benchmark': bench,
                        'workload': workload,
                        'round': r,
                        'time': t,
                        'threads': threads,
                        'opt': opt,
                        'compiler': compiler,
                        'data_val': data_val
                    })

df = pd.DataFrame(records)

# -------------------------------------------------------------
# Chart 1: Boxplot of Normalized Execution Time (T / T_min) per Workload
# -------------------------------------------------------------
df['norm_time'] = df.groupby(['server', 'workload'])['time'].transform(lambda x: x / (x.min() + 1e-9))
fig, ax = plt.subplots(figsize=(14, 7), dpi=300)
top_workloads = df.groupby('workload')['norm_time'].std().sort_values(ascending=False).head(20).index
sub_df = df[df['workload'].isin(top_workloads)]

box_data = [sub_df[sub_df['workload'] == wl]['norm_time'].values for wl in top_workloads]
ax.boxplot(box_data, tick_labels=top_workloads, vert=True, patch_artist=True,
           boxprops=dict(facecolor='#3b82f6', color='#1d4ed8', alpha=0.7),
           medianprops=dict(color='#ef4444', linewidth=2))

ax.set_title('图1：工作负载在开放配置空间下的归一化运行时间箱线图 (Boxplot)', fontsize=14, pad=15)
ax.set_ylabel('归一化运行时间 (T / T_min)', fontsize=12)
ax.set_xlabel('工作负载 (Workload)', fontsize=12)
plt.xticks(rotation=45, ha='right', fontsize=9)
plt.yscale('log')
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
fig1_path = os.path.join(output_dir, 'fig1_boxplot_workload_variance.png')
plt.savefig(fig1_path)
plt.close()

# -------------------------------------------------------------
# Chart 2: Speedup CDF Distribution Across Identical Round Configurations
# -------------------------------------------------------------
piv = df.pivot(index=['workload', 'round'], columns='server', values='time').dropna()
piv['speedup_amd_vs_65'] = piv['zf_65'] / piv['zf_amd'] # EPYC 7543 vs Kunpeng 920 (zf_65)
piv['speedup_65_vs_64'] = piv['zf_64'] / piv['zf_65']  # Kunpeng 920 v2 vs v1

fig, ax = plt.subplots(figsize=(9, 6), dpi=300)

# AMD vs Kunpeng
vals_amd = np.sort(piv['speedup_amd_vs_65'].values)
cdf_amd = np.arange(1, len(vals_amd) + 1) / len(vals_amd)
ax.plot(vals_amd, cdf_amd, label='AMD EPYC 7543 相对于 鲲鹏 920 (zf_65) 加速比 CDF', color='#d97706', linewidth=2.5)

# Kunpeng v2 vs v1
vals_kp = np.sort(piv['speedup_65_vs_64'].values)
cdf_kp = np.arange(1, len(vals_kp) + 1) / len(vals_kp)
ax.plot(vals_kp, cdf_kp, label='鲲鹏 920 v2 (zf_65) 相对于 v1 (zf_64) 加速比 CDF', color='#0891b2', linewidth=2.5)

# Reference line x = 1.0 (Tie/Boundary)
ax.axvline(x=1.0, color='#ef4444', linestyle='--', linewidth=1.5, label='加速比临界线 (S = 1.0)')

ax.set_title('图2：跨 CPU 在同等配置下的相对加速比累积分布图 (CDF)', fontsize=14, pad=15)
ax.set_xlabel('相对加速比 S = T_A / T_B (对数刻度, S > 1.0 表示胜出)', fontsize=11)
ax.set_ylabel('累积概率 F(S) = P(Speedup ≤ S)', fontsize=11)
ax.set_xscale('log')
ax.set_xlim(0.1, 100)
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend(fontsize=10, loc='lower right')
plt.tight_layout()
fig2_path = os.path.join(output_dir, 'fig2_cdf_speedup.png')
plt.savefig(fig2_path)
plt.close()

# -------------------------------------------------------------
# Chart 3: Full ANOVA Type-II SS & MS Percentage Decomposition Stacked Bar Chart
# -------------------------------------------------------------
# Selected 18 representative workloads
wl_list = df['workload'].unique()[:18]
stack_data = []

for wl in wl_list:
    sub = df[df['workload'] == wl]
    y = sub['time'].values
    n = len(y)
    ss_tot = np.sum((y - y.mean())**2)
    
    if ss_tot == 0 or n <= 4:
        stack_data.append({'workload': wl, 'MS_Data': 0, 'MS_Threads': 0, 'MS_Compiler': 0, 'MS_Opt': 0, 'MS_Residual': 100})
        continue

    # One-hot / regression matrix helper
    def get_X(cols):
        X_list = [np.ones((n, 1))]
        for col in cols:
            val = sub[col]
            if val.notna().sum() > 0 and val.nunique() > 1:
                if col in ['data_val', 'threads']:
                    v_std = (val.values - val.mean()) / (val.std() + 1e-9)
                    X_list.append(v_std.reshape(-1, 1))
                else:
                    dummies = pd.get_dummies(val, drop_first=True, dtype=float).values
                    X_list.append(dummies)
        if len(X_list) == 1:
            return np.ones((n, 1))
        return np.hstack(X_list)

    all_cols = ['data_val', 'threads', 'compiler', 'opt']
    valid_cols = [c for c in all_cols if sub[c].notna().sum() > 0 and sub[c].nunique() > 1]
    
    # Fit full model
    X_full = get_X(valid_cols)
    beta_full, _, _, _ = np.linalg.lstsq(X_full, y, rcond=None)
    y_pred_full = X_full @ beta_full
    ss_res = np.sum((y - y_pred_full)**2)
    
    df_res = max(1, n - X_full.shape[1])
    ms_res = ss_res / df_res
    
    # Type-II SS and MS calculation for each factor
    ms_dict = {}
    for col in valid_cols:
        cols_sub = [c for c in valid_cols if c != col]
        X_sub = get_X(cols_sub)
        beta_sub, _, _, _ = np.linalg.lstsq(X_sub, y, rcond=None)
        y_pred_sub = X_sub @ beta_sub
        ss_res_sub = np.sum((y - y_pred_sub)**2)
        ss_col = max(0, ss_res_sub - ss_res)
        
        # Degrees of freedom for this factor
        df_col = max(1, sub[col].nunique() - 1)
        ms_col = ss_col / df_col  # Adjusted Mean Square (variance per degree of freedom)
        ms_dict[col] = ms_col
        
    ms_data = ms_dict.get('data_val', 0)
    ms_threads = ms_dict.get('threads', 0)
    ms_comp = ms_dict.get('compiler', 0)
    ms_opt = ms_dict.get('opt', 0)
    
    ms_total = ms_data + ms_threads + ms_comp + ms_opt + ms_res + 1e-9
    
    stack_data.append({
        'workload': wl,
        'MS_Data': (ms_data / ms_total) * 100,
        'MS_Threads': (ms_threads / ms_total) * 100,
        'MS_Compiler': (ms_comp / ms_total) * 100,
        'MS_Opt': (ms_opt / ms_total) * 100,
        'MS_Residual': (ms_res / ms_total) * 100
    })

s_df = pd.DataFrame(stack_data)

fig, ax = plt.subplots(figsize=(13, 6), dpi=300)
x_indices = np.arange(len(s_df))
width = 0.55

b1 = ax.bar(x_indices, s_df['MS_Data'], width, label='数据大小 (MS_Data, df-adj)', color='#2563eb', alpha=0.9)
b2 = ax.bar(x_indices, s_df['MS_Threads'], width, bottom=s_df['MS_Data'], label='线程数 (MS_Threads, df-adj)', color='#10b981', alpha=0.9)
b3 = ax.bar(x_indices, s_df['MS_Compiler'], width, bottom=s_df['MS_Data'] + s_df['MS_Threads'], label='编译器 (MS_Compiler, df-adj)', color='#f59e0b', alpha=0.9)
b4 = ax.bar(x_indices, s_df['MS_Opt'], width, bottom=s_df['MS_Data'] + s_df['MS_Threads'] + s_df['MS_Compiler'], label='优化级别 (MS_Opt, df-adj)', color='#ef4444', alpha=0.9)
b5 = ax.bar(x_indices, s_df['MS_Residual'], width, bottom=s_df['MS_Data'] + s_df['MS_Threads'] + s_df['MS_Compiler'] + s_df['MS_Opt'], label='残差与未解释方差 (MS_Residual)', color='#9ca3af', alpha=0.6)

ax.set_title('图3：自由度校正 (Degree-of-Freedom Adjusted ANOVA MS) 方差贡献率百分比堆叠图', fontsize=14, pad=15)
ax.set_ylabel('校正后方差贡献占比 MS_k / ∑MS (%)', fontsize=11)
ax.set_xticks(x_indices)
ax.set_xticklabels(s_df['workload'], rotation=45, ha='right', fontsize=9)
ax.set_ylim(0, 100)
ax.grid(axis='y', linestyle='--', alpha=0.5)
ax.legend(loc='upper right', fontsize=10)
plt.tight_layout()
fig3_path = os.path.join(output_dir, 'fig3_stacked_bar_anova_full.png')
plt.savefig(fig3_path)
plt.close()

# -------------------------------------------------------------
# Chart 4: 2D Response Surface Heatmap (Compiler & Opt x Threads) for C Workload
# -------------------------------------------------------------
c_sub = df[(df['workload'] == 'background_sub') & (df['server'] == 'zf_amd')].copy()
c_sub['comp_opt'] = c_sub['compiler'].astype(str) + '-' + c_sub['opt'].astype(str)

piv_c = c_sub.pivot_table(index='comp_opt', columns='threads', values='time', aggfunc='mean')

fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
im = ax.imshow(piv_c.values, cmap='YlOrRd', aspect='auto')

ax.set_xticks(np.arange(len(piv_c.columns)))
ax.set_yticks(np.arange(len(piv_c.index)))
ax.set_xticklabels([f"{t} 线程" for t in piv_c.columns], fontsize=10)
ax.set_yticklabels(piv_c.index, fontsize=10)

for i in range(len(piv_c.index)):
    for j in range(len(piv_c.columns)):
        val = piv_c.values[i, j]
        if not np.isnan(val):
            ax.text(j, i, f"{val:.1f}s", ha="center", va="center", color="white" if val > piv_c.values.max()*0.7 else "black", fontsize=9, fontweight='bold')

ax.set_title('图4：C/C++ 负载 (background_sub) 编译器/优化级别 × 线程数 响应面热力图', fontsize=14, pad=15)
ax.set_xlabel('并发线程数 (Threads)', fontsize=12)
ax.set_ylabel('编译器与优化级别 (Compiler-Opt)', fontsize=12)
plt.colorbar(im, ax=ax, label='执行时间 (秒)')
plt.tight_layout()
fig4_path = os.path.join(output_dir, 'fig4_response_surface_heatmap.png')
plt.savefig(fig4_path)
plt.close()

print("New charts generated successfully:")
print("1.", fig1_path)
print("2.", fig2_path)
print("3.", fig3_path)
print("4.", fig4_path)

