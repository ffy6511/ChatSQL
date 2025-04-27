'use client'

import React, { useState, type ReactElement } from 'react';
import { Modal, Button, Steps } from 'antd';
import styles from './GuidingModal.module.css';

interface GuidingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Step } = Steps;

const GuidingModal: React.FC<GuidingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '欢迎使用',
      content: (
        <div className={styles.stepContent}>
          <h3>欢迎使用 ChatSQL</h3>
          <p>这是一个帮助您学习和使用SQL的交互式工具。</p>
          <p>通过以下步骤，您将了解如何使用本应用的主要功能。</p>
          <div className={styles.gifContainer}>
            {/* 这里可以放置欢迎使用的GIF或图片 */}
            <div className={styles.placeholderImage}>欢迎使用GIF</div>
          </div>
        </div>
      ),
    },
    {
      title: '创建问题',
      content: (
        <div className={styles.stepContent}>
          <h3>如何创建SQL问题</h3>
          <p>1. 点击右上角的"+"按钮创建新对话</p>
          <p>2. 输入您想要的SQL问题描述</p>
          <p>3. 选择难度级别和标签</p>
          <p>4. 点击提交按钮生成问题</p>
          <div className={styles.gifContainer}>
            {/* 这里可以放置创建问题的GIF或图片 */}
            <div className={styles.placeholderImage}>创建问题GIF</div>
          </div>
        </div>
      ),
    },
    {
      title: '查看结果',
      content: (
        <div className={styles.stepContent}>
          <h3>查看和保存结果</h3>
          <p>1. 系统会生成SQL问题和相应的数据库结构</p>
          <p>2. 您可以查看表结构和关系</p>
          <p>3. 在SQL编辑器中编写查询</p>
          <p>4. 点击"确认并保存"按钮保存问题</p>
          <div className={styles.gifContainer}>
            {/* 这里可以放置查看结果的GIF或图片 */}
            <div className={styles.placeholderImage}>查看结果GIF</div>
          </div>
        </div>
      ),
    },
    {
      title: '历史记录',
      content: (
        <div className={styles.stepContent}>
          <h3>管理历史记录</h3>
          <p>1. 在左侧面板查看历史记录</p>
          <p>2. 点击记录可以重新加载问题</p>
          <p>3. 您可以收藏、重命名或删除记录</p>
          <p>4. 使用"最近"和"收藏"标签页进行分类查看</p>
          <div className={styles.gifContainer}>
            {/* 这里可以放置历史记录的GIF或图片 */}
            <div className={styles.placeholderImage}>历史记录GIF</div>
          </div>
        </div>
      ),
    },
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Modal
      title="使用指南"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={700}
      className={styles.guidingModal}
      centered
    >
      <Steps current={currentStep} className={styles.steps}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <div className={styles.stepsContent}>
        {steps[currentStep].content}
      </div>
      
      <div className={styles.stepsAction}>
        {currentStep > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={prev}>
            上一步
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={next}>
            下一步
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" onClick={handleClose}>
            完成
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default GuidingModal;
