"use client";

import React, { useState, type ReactElement } from "react";
import { Modal, Button, Steps } from "antd";
import { LeftOutlined, RightOutlined, CheckOutlined } from "@ant-design/icons";
import styles from "./GuidingModal.module.css";

interface GuidingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { Step } = Steps;

const GuidingModal: React.FC<GuidingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "欢迎使用",
      content: (
        <div className={styles.stepContent}>
          <h3>👋 欢迎使用 ChatSQL</h3>
          <p>这是一个帮助您学习和使用SQL的交互式工具。</p>
          <p>通过以下步骤，您将了解如何使用本应用的主要功能。</p>
          <div className={styles.gifContainer}>
            <img
              src="/assets/initialization.png"
              alt="Initialization Interface"
              width="80%"
            />
          </div>
        </div>
      ),
    },
    {
      title: "创建问题",
      content: (
        <div className={styles.stepContent}>
          <h3>如何创建SQL问题</h3>
          <p>1. 点击侧边栏的"+"按钮创建新对话</p>
          <p>2. 输入您想要的SQL问题描述</p>
          <p>3. 选择难度级别和标签</p>
          <p>4. 点击提交按钮生成问题</p>
          <div className={styles.gifContainer}>
            <video
              autoPlay
              loop
              muted
              playsInline
              className={styles.videoPlayer}
            >
              <source src="/assets/chat.m4v" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ),
    },
    {
      title: "查看结果",
      content: (
        <div className={styles.stepContent}>
          <h3>查看和保存结果</h3>
          <p>1. 系统会生成SQL问题和相应的数据库结构</p>
          <p>2. 您可以查看表结构和关系</p>
          <div className={styles.gifContainer}>
            <img
              src="/assets/rendering.png"
              alt="Initialization Interface"
              width="100%"
            />
          </div>
        </div>
      ),
    },
    {
      title: "查询与测试",
      content: (
        <div className={styles.stepContent}>
          <h3>编辑和测试SQL</h3>
          <p>1. 系统会生成SQL问题和相应的数据库结构</p>
          <p>2. 您可以查看表结构和关系</p>
          <p>3. 在SQL编辑器中编写查询</p>
          <p>4. 点击运行按钮执行查询并点击比较来判断是否正确</p>
          <div className={styles.gifContainer}>
            <img src="/assets/edit.gif" alt="edit code" />
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
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <div className={styles.stepsContent}>{steps[currentStep].content}</div>

      <div className={styles.stepsAction}>
        {currentStep > 0 && (
          <Button icon={<LeftOutlined />} shape="circle" onClick={prev} />
        )}
        {currentStep < steps.length - 1 && (
          <Button
            type="primary"
            icon={<RightOutlined />}
            shape="circle"
            onClick={next}
          />
        )}
        {currentStep === steps.length - 1 && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            shape="circle"
            onClick={handleClose}
          />
        )}
      </div>
    </Modal>
  );
};

export default GuidingModal;
